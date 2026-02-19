import type { Address, Mutez, Shard } from './types'
import { TezosToolkit, UnitValue } from '@taquito/taquito'
import HarbingerClient from './harbinger-client'
import StableCoinClient from './stable-coin-client'
import BigNumber from 'bignumber.js'

const MUTEZ_DIGITS = 6
const SHARD_DIGITS = 18
const MUTEZ_TO_SHARD = new BigNumber(Math.pow(10, SHARD_DIGITS - MUTEZ_DIGITS))
const SHARD_PRECISION = new BigNumber(Math.pow(10, SHARD_DIGITS))

export default class OvenClient {
  private readonly tezos: TezosToolkit

  public constructor(
    nodeUrl: string,
    wallet: any,
    public readonly ovenAddress: Address,
    public readonly stableCoinClient: StableCoinClient,
    public readonly harbingerClient: HarbingerClient,
  ) {
    const tezos = new TezosToolkit(nodeUrl)
    tezos.setWalletProvider(wallet)
    this.tezos = tezos
  }

  public async getCollateralUtilization(): Promise<Shard> {
    const { price } = await this.harbingerClient.getPriceData()
    const priceShard = price.multipliedBy(MUTEZ_TO_SHARD)
    const currentBalance = await this.getBalance()
    const collateralValue = currentBalance
      .multipliedBy(MUTEZ_TO_SHARD)
      .multipliedBy(priceShard)
      .dividedBy(SHARD_PRECISION)
    const totalBorrowedTokens = await this.getTotalOutstandingTokens()
    return new BigNumber(totalBorrowedTokens.times(Math.pow(10, SHARD_DIGITS)).dividedBy(collateralValue).toFixed(0))
  }

  public async getBaker(): Promise<Address | null> {
    try {
      return await this.tezos.rpc.getDelegate(this.ovenAddress)
    } catch (e: any) {
      if (e.status === 404) {
        return null
      }
      throw e
    }
  }

  public async getOwner(ovenStorage: any | undefined = undefined): Promise<Address> {
    const resolvedOvenStorage = ovenStorage ?? ((await (await this.tezos.wallet.at(this.ovenAddress)).storage()) as any)
    return resolvedOvenStorage.owner
  }

  public async getBorrowedTokens(ovenStorage: any | undefined = undefined): Promise<Shard> {
    const resolvedOvenStorage = ovenStorage ?? ((await (await this.tezos.wallet.at(this.ovenAddress)).storage()) as any)
    return resolvedOvenStorage.borrowedTokens
  }

  public async getTotalOutstandingTokens(
    time: Date = new Date(),
    ovenStorage: any | undefined = undefined,
  ): Promise<Shard> {
    const stabilityFees = await this.getStabilityFees(time, ovenStorage)
    const borrowedTokens = await this.getBorrowedTokens()
    return stabilityFees.plus(borrowedTokens)
  }

  public async getStabilityFees(time: Date = new Date(), ovenStorage: any | undefined = undefined): Promise<Shard> {
    const resolvedOvenStorage = ovenStorage ?? ((await (await this.tezos.wallet.at(this.ovenAddress)).storage()) as any)
    const stabilityFeeTokens: BigNumber = resolvedOvenStorage.stabilityFeeTokens

    const interestData = await this.stableCoinClient.getInterestData(time)
    const ovenInterestIndex: BigNumber = resolvedOvenStorage.interestIndex
    const borrowedTokens = await this.getBorrowedTokens(ovenStorage)
    const minterInterestIndex: BigNumber = interestData.globalInterestIndex

    // Use ROUND_DOWN to match Michelson's EDIV (truncating integer division)
    const ratio = minterInterestIndex.times(SHARD_PRECISION).div(ovenInterestIndex).integerValue(BigNumber.ROUND_DOWN)
    const totalPrinciple = borrowedTokens.plus(stabilityFeeTokens)
    const newTotalTokens = ratio.times(totalPrinciple).div(SHARD_PRECISION).integerValue(BigNumber.ROUND_DOWN)
    return newTotalTokens.minus(borrowedTokens)
  }

  public async isLiquidated(ovenStorage: any | undefined = undefined): Promise<boolean> {
    const resolvedOvenStorage = ovenStorage ?? ((await (await this.tezos.wallet.at(this.ovenAddress)).storage()) as any)
    return resolvedOvenStorage.isLiquidated
  }

  public async getBalance(): Promise<Mutez> {
    return await this.tezos.tz.getBalance(this.ovenAddress)
  }

  public async setBaker(baker: Address | null): Promise<any> {
    return this.invokeOvenMethod('setDelegate', baker)
  }

  public async liquidate(): Promise<any> {
    return this.invokeOvenMethod('liquidate', UnitValue)
  }

  public async borrow(tokens: Shard): Promise<any> {
    return this.invokeOvenMethod('borrow', tokens)
  }

  public async deposit(mutez: Mutez): Promise<any> {
    return await this.tezos.wallet.transfer({
      to: this.ovenAddress,
      amount: Number(mutez),
      mutez: true,
    }).send()
  }

  public async withdraw(mutez: Mutez): Promise<any> {
    return this.invokeOvenMethod('withdraw', mutez)
  }

  public async repay(tokensToRepay: Shard): Promise<any> {
    return this.invokeOvenMethod('repay', tokensToRepay)
  }

  private async invokeOvenMethod(entrypoint: string, args: any, amount = 0): Promise<any> {
    const ovenContract = await this.tezos.wallet.at(this.ovenAddress)
    const sendArgs = { amount: amount, mutez: true }
    return await ovenContract.methodsObject[entrypoint](args).send(sendArgs)
  }
}
