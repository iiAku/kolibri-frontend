import BigNumber from 'bignumber.js'
import { ConversionUtils } from '~/lib/kolibri'
import { useKolibriStore } from '~/stores/kolibri'
import { customGetCollateralUtilization } from '~/utils/collateral'
import { MUTEZ, SHARD } from '~/utils/constants'
import type { OvenData } from '~/types'

export const useOvenCalculations = () => {
  const store = useKolibriStore()

  const borrowedTokens = (ovenAddress: string): BigNumber => {
    if (!ovenAddress || !store.ownedOvens?.[ovenAddress]?.borrowedTokens) return new BigNumber(0)
    return store.ownedOvens[ovenAddress].borrowedTokens
  }

  const outstandingTokens = (ovenAddress: string): BigNumber => {
    if (!ovenAddress || !store.ownedOvens?.[ovenAddress]?.outstandingTokens) return new BigNumber(0)
    return store.ownedOvens[ovenAddress].outstandingTokens
  }

  const borrowedTokensFormatted = (ovenAddress: string): BigNumber =>
    borrowedTokens(ovenAddress).dividedBy(SHARD)

  const outstandingTokensFormatted = (ovenAddress: string): BigNumber =>
    outstandingTokens(ovenAddress).dividedBy(SHARD)

  const ovenBalance = (ovenAddress: string): BigNumber => {
    if (!store.ownedOvens?.[ovenAddress]?.balance) return new BigNumber(0)
    return store.ownedOvens[ovenAddress].balance
  }

  const ovenBalanceFormatted = (ovenAddress: string): BigNumber =>
    ovenBalance(ovenAddress).dividedBy(MUTEZ)

  const currentPriceFormatted = (): BigNumber =>
    store.priceData!.price.dividedBy(MUTEZ)

  const ovenDollarValue = (ovenAddress: string): BigNumber => {
    const holdings = ovenBalanceFormatted(ovenAddress)
    const price = currentPriceFormatted()
    return price.multipliedBy(holdings)
  }

  const ovenDollarValuePlusDeposit = (ovenAddress: string, depositAmount: BigNumber): BigNumber => {
    const holdings = ovenBalanceFormatted(ovenAddress).plus(depositAmount)
    const price = currentPriceFormatted()
    return price.multipliedBy(holdings)
  }

  const ovenDollarValueMinusWithdraw = (ovenAddress: string, withdrawAmount: BigNumber): BigNumber => {
    const holdings = ovenBalanceFormatted(ovenAddress).minus(withdrawAmount)
    const price = currentPriceFormatted()
    return price.multipliedBy(holdings)
  }

  const maxBorrowAmtkUSD = (ovenAddress: string): BigNumber => {
    const borrowed = outstandingTokensFormatted(ovenAddress)
    const value = ovenDollarValue(ovenAddress)
    return value.dividedBy(store.collateralOperand!).minus(borrowed).decimalPlaces(18)
  }

  const currentCollateralRate = (ovenAddress: string): BigNumber => {
    const maxCollateral = ovenDollarValue(ovenAddress).dividedBy(store.collateralOperand!)
    const borrowed = outstandingTokensFormatted(ovenAddress)

    if (maxCollateral.isZero()) return new BigNumber(0)
    return borrowed.dividedBy(maxCollateral).times(100)
  }

  const collatoralizedRateForOven = (oven: OvenData): string => {
    const collateralUtilization = customGetCollateralUtilization(
      store.priceData!.price,
      oven.balance,
      oven.outstandingTokens,
    )

    const rate = collateralUtilization.multipliedBy(store.collateralOperand!)

    return parseFloat(
      ConversionUtils.shardToHumanReadablePercentage(rate),
    ).toFixed(2)
  }

  const collatoralizationWarningClasses = (rate: number): string => {
    if (rate > 100) return 'is-danger'
    if (rate > 90) return 'is-warning'
    return 'is-primary'
  }

  const liquidatablePrice = (ovenAddress: string): BigNumber => {
    const rateDelta = 1 - currentCollateralRate(ovenAddress).dividedBy(100).toNumber()
    const price = store.priceData!.price.dividedBy(MUTEZ)
    return price.minus(price.times(rateDelta))
  }

  return {
    borrowedTokens,
    outstandingTokens,
    borrowedTokensFormatted,
    outstandingTokensFormatted,
    ovenBalance,
    ovenBalanceFormatted,
    currentPriceFormatted,
    ovenDollarValue,
    ovenDollarValuePlusDeposit,
    ovenDollarValueMinusWithdraw,
    maxBorrowAmtkUSD,
    currentCollateralRate,
    collatoralizedRateForOven,
    collatoralizationWarningClasses,
    liquidatablePrice,
  }
}
