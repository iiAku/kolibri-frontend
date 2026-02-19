import type BigNumber from 'bignumber.js'

export interface OvenData {
  ovenAddress: string
  ovenOwner: string
  baker: string
  balance: BigNumber
  borrowedTokens: BigNumber
  stabilityFee: BigNumber
  outstandingTokens: BigNumber
  isLiquidated: boolean
}

export interface PriceData {
  timestamp: number
  price: BigNumber
}

export interface BalanceData {
  totalBalance: BigNumber
  totalTokens: BigNumber
}

export interface BakerInfo {
  address: string
  alias: string | null
  stakingBalance: number
  numDelegators: number
}

export const WalletStates = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  ERROR: 'ERROR',
} as const

export type WalletState = (typeof WalletStates)[keyof typeof WalletStates]

export type NetworkName = 'mainnet' | 'ghostnet' | 'sandbox'
