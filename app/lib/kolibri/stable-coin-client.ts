import { Network } from './types'
import type { Address, Shard, Oven, InterestData } from './types'
import { TezosToolkit, UnitValue } from '@taquito/taquito'
import BigNumber from 'bignumber.js'
import axios, { type AxiosResponse } from 'axios'
import CONSTANTS from './constants'
import { compoundingLinearApproximation, interestRateToApy } from './utils'
import type Decimal from 'decimal.js'

export default class StableCoinClient {
  private readonly tezos: TezosToolkit

  public constructor(
    nodeUrl: string,
    private readonly network: Network,
    private readonly ovenRegistryAddress: Address,
    private readonly minterAddress: Address,
    private readonly ovenFactoryAddress: Address,
    private readonly indexerURL?: string,
  ) {
    this.tezos = new TezosToolkit(nodeUrl)
  }

  public getNetwork(): string {
    const networkString = this.network.toString()
    return networkString.charAt(0).toUpperCase() + networkString.slice(1)
  }

  public async deployOven(wallet: any): Promise<any> {
    this.tezos.setWalletProvider(wallet)
    const ovenFactoryContract = await this.tezos.wallet.at(this.ovenFactoryAddress)
    return ovenFactoryContract.methodsObject.makeOven(UnitValue).send()
  }

  public async getStabilityFeeApy(): Promise<Decimal> {
    const minterContract = await this.tezos.contract.at(this.minterAddress)
    const minterStorage: any = await minterContract.storage()
    const stabilityFee = await minterStorage.stabilityFee
    return interestRateToApy(stabilityFee)
  }

  public async getSimpleStabilityFee(): Promise<Shard> {
    const minterContract = await this.tezos.contract.at(this.minterAddress)
    const minterStorage: any = await minterContract.storage()
    return await minterStorage.stabilityFee
  }

  public async getRequiredCollateralizationRatio(): Promise<Shard> {
    const minterContract = await this.tezos.contract.at(this.minterAddress)
    const minterStorage: any = await minterContract.storage()
    return await minterStorage.collateralizationPercentage
  }

  public async getInterestData(time: Date = new Date()): Promise<InterestData> {
    const minterContract = await this.tezos.contract.at(this.minterAddress)
    const minterStorage: any = await minterContract.storage()

    const globalInterestIndex: BigNumber = await minterStorage.interestIndex

    const raw = await minterStorage.lastInterestIndexUpdateTime
    const lastUpdateTime = new Date(`${raw}`)

    const deltaMs = time.getTime() - lastUpdateTime.getTime()
    const deltaSecs = Math.floor(deltaMs / 1000)
    const numPeriods = Math.floor(deltaSecs / CONSTANTS.COMPOUND_PERIOD_SECONDS)

    const simpleStabilityFee = await this.getSimpleStabilityFee()

    const globalInterestIndexApproximation = compoundingLinearApproximation(
      globalInterestIndex,
      simpleStabilityFee,
      numPeriods,
    )
    return {
      globalInterestIndex: globalInterestIndexApproximation,
      lastUpdateTime: time,
    }
  }

  public async getOvenCount(): Promise<number> {
    const ovens = await this.getAllOvens()
    return ovens.length
  }

  public async ovensOwnedByAddress(address: Address): Promise<Array<Address>> {
    const allOvens = await this.getAllOvens()
    return allOvens
      .filter((oven) => oven.ovenOwner === address)
      .map((oven) => oven.ovenAddress)
  }

  async getAllOvens(): Promise<Array<Oven>> {
    if (this.indexerURL === undefined) {
      const response = await axios.get(`https://kolibri-data.s3.amazonaws.com/${this.network}/oven-key-data.json`)
      return response.data.ovenData
    } else {
      const ovenRegistryContract = await this.tezos.contract.at(this.ovenRegistryAddress)
      const ovenRegistryStorage: any = await ovenRegistryContract.storage()
      const ovenRegistryBigMapId = await ovenRegistryStorage.ovenMap

      let offset = 0
      const results: any[] = []

      while (true) {
        const values: AxiosResponse = await axios.get(
          `${this.indexerURL}/v1/bigmap/sandboxnet/${ovenRegistryBigMapId}/keys?size=10&offset=${offset}`,
        )
        values.data.forEach((value: any) => {
          results.push({
            ovenAddress: value.data.key.value,
            ovenOwner: value.data.value.value,
          })
        })

        if (values.data.length < 10) {
          break
        }

        offset += 10
      }

      return results
    }
  }
}
