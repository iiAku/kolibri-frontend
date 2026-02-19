import type { Address } from './types'
import { TezosToolkit, TransactionWalletOperation } from '@taquito/taquito'
import BigNumber from 'bignumber.js'
import CONSTANTS from './constants'
import Decimal from 'decimal.js'

export const deriveOvenAddress = async (operation: TransactionWalletOperation): Promise<Address> => {
  const ovenCreationResults = await operation.operationResults()

  const transactionResult = ovenCreationResults.find(
    (result: any) => result.kind === 'transaction',
  ) as any

  const ovenResult = transactionResult.metadata.internal_operation_results.find(
    (op: any) => op.kind === 'origination',
  )!.result

  return ovenResult.originated_contracts![0]
}

export const interestRateToApy = (interestRatePerPeriod: BigNumber): Decimal => {
  const currentValueNoMantissa = new BigNumber(interestRatePerPeriod).dividedBy(new BigNumber(10).pow(18))
  const currentValueDecimal = new Decimal(currentValueNoMantissa.toFixed(18)).times(60 * 24 * 365)
  const E = new Decimal(
    '2.7182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274',
  )
  const invertedLN = E.pow(currentValueDecimal)
  return invertedLN.minus(1).times(100)
}

export const compoundingLinearApproximation = (
  initial: BigNumber,
  interestRatePerPeriod: BigNumber,
  numPeriods: number,
): BigNumber => {
  return initial.times(CONSTANTS.PRECISION.plus(interestRatePerPeriod.times(numPeriods))).div(CONSTANTS.PRECISION)
}

export const getTokenBalance = async (
  holder: Address,
  tokenContractAddress: Address,
  tezos: TezosToolkit,
  tokenContractStorage: any | undefined = undefined,
): Promise<BigNumber> => {
  const resolvedTokenStorage =
    tokenContractStorage ?? ((await (await tezos.wallet.at(tokenContractAddress)).storage()) as any)
  const balance = await resolvedTokenStorage.balances.get(holder)
  return balance === undefined ? new BigNumber(0) : balance.balance
}
