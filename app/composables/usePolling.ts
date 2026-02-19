import axios from 'axios'
import BigNumber from 'bignumber.js'
import { Network } from '~/lib/kolibri'
import { useKolibriStore } from '~/stores/kolibri'
import { SHARD, COLLATERAL_DIVISOR } from '~/utils/constants'
import { useWallet } from '~/composables/useWallet'
import type { OvenData } from '~/types'

export const usePolling = () => {
  const store = useKolibriStore()
  const { calculateSandboxStabFeeTime } = useWallet()

  let updatePriceInfoTimer: ReturnType<typeof setInterval> | null = null
  let updateAllOvenDataTimer: ReturnType<typeof setInterval> | null = null

  const updatePriceInfo = async () => {
    const baseUrl = `${store.nodeURL}/chains/main/blocks/head/context/big_maps/597699/exprtbVCZ3qh45pH3wZpx1TN2pAJ94pss44kpbHodsxuQ8E7ntVw4M`
    const response = await axios.get(baseUrl)
    const data = response.data
    if (data.prim !== 'Pair' || !Array.isArray(data.args)) {
      throw new Error('Unexpected oracle response format')
    }
    const [price, timestamp] = data.args.map((arg: any) => Number(arg.int))
    store.priceData = { timestamp, price: new BigNumber(price) }
  }

  const updateMinterData = async () => {
    const contract = await store.tezosToolkit.contract.at(store.NETWORK_CONTRACTS.MINTER)
    const minterStorage = await contract.storage() as any

    store.stabilityFee = minterStorage.stabilityFee
      .dividedBy(SHARD)
      .plus(1)
      .pow(365 * 24 * 60)
      .minus(1)
      .times(SHARD)

    store.collateralRate = minterStorage.collateralizationPercentage
    store.privateLiquidationThreshold = minterStorage.privateOwnerLiquidationThreshold || null
    store.collateralOperand = store.collateralRate!
      .minus(store.privateLiquidationThreshold ?? 0)
      .dividedBy(COLLATERAL_DIVISOR)
  }

  const updateAllOvenData = async () => {
    try {
      const response = await axios.get(
        `https://kolibri-data.s3.amazonaws.com/${store.network}/oven-data.json`,
      )

      store.allOvensData = response.data.allOvenData.map((oven: any): OvenData => ({
        balance: new BigNumber(oven.balance),
        borrowedTokens: new BigNumber(oven.borrowedTokens),
        stabilityFee: new BigNumber(oven.stabilityFees),
        outstandingTokens: new BigNumber(oven.outstandingTokens),
        ovenAddress: oven.ovenAddress,
        ovenOwner: oven.ovenOwner,
        baker: oven.baker,
        isLiquidated: oven.isLiquidated ?? false,
      }))
    } catch (e) {
      if (store.network === Network.Sandbox) {
        store.balanceData = null
        store.allOvensData = await manuallyResolveOvens()
        store.balanceData = manuallyCalculateBalanceData()
      }

      if (updateAllOvenDataTimer) {
        clearInterval(updateAllOvenDataTimer)
        updateAllOvenDataTimer = null
      }
      console.error(e)
    }
  }

  const manuallyResolveOvens = async (): Promise<OvenData[]> => {
    const ovens = await store.stableCoinClient.getAllOvens()
    return Promise.all(
      ovens.map(async (oven: any) => {
        const ovenClientInst = store.getOvenClient(store.wallet, oven.ovenAddress)

        const [baker, balance, borrowedTokens, stabilityFee, isLiquidated] = await Promise.all([
          ovenClientInst.getBaker(),
          ovenClientInst.getBalance(),
          ovenClientInst.getBorrowedTokens(),
          ovenClientInst.getStabilityFees(calculateSandboxStabFeeTime()),
          ovenClientInst.isLiquidated(),
        ])

        const outstandingTokens = borrowedTokens.plus(stabilityFee)

        return {
          ...oven,
          baker,
          balance,
          borrowedTokens,
          stabilityFee,
          outstandingTokens,
          isLiquidated,
        }
      }),
    )
  }

  const manuallyCalculateBalanceData = () => {
    const ovens = store.allOvensData!
    return {
      totalBalance: ovens.reduce((acc, oven) => oven.balance.plus(acc), new BigNumber(0)),
      totalTokens: ovens
        .reduce((acc, oven) => oven.outstandingTokens.plus(acc), new BigNumber(0))
        .dividedBy(SHARD),
    }
  }

  const updateBlockHeight = async () => {
    const currentBlock = await store.tezosToolkit.rpc.getBlock()
    store.currentBlockHeight = currentBlock.header.level
    const interval = store.network === Network.Sandbox ? 4000 : 5000
    setTimeout(updateBlockHeight, interval)
  }

  const loadDAOStorage = async () => {
    const contract = await store.tezosToolkit.contract.at(store.NETWORK_CONTRACTS.DAO)
    store.daoStorage = await contract.storage()
  }

  const startPolling = () => {
    updatePriceInfoTimer = setInterval(updatePriceInfo, 60 * 1000)
    updateAllOvenDataTimer = setInterval(updateAllOvenData, 60 * 1000)
  }

  const stopPolling = () => {
    if (updatePriceInfoTimer) clearInterval(updatePriceInfoTimer)
    if (updateAllOvenDataTimer) clearInterval(updateAllOvenDataTimer)
  }

  return {
    updatePriceInfo,
    updateMinterData,
    updateAllOvenData,
    updateBlockHeight,
    loadDAOStorage,
    startPolling,
    stopPolling,
  }
}
