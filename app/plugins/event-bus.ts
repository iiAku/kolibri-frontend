import mitt from 'mitt'
import type { WalletOperation } from '@taquito/taquito'

export type AppEvents = {
  'wallet-connected': void
  'wallet-connect-request': any
  'wallet-reconnect-request': void
  'tx-submitted': WalletOperation
  'tx-finished': void
  'oven-tx-submitted': { txResult: any; ovenAddress: string; verb: string }
  'refresh-farms': void
  'refresh-all-ovens': void
  'refresh-holdings': void
  'refresh-kdao-holdings': void
}

export default defineNuxtPlugin(() => {
  const eventBus = mitt<AppEvents>()

  return {
    provide: {
      eventBus,
    },
  }
})
