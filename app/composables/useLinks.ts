import { useKolibriStore } from '~/stores/kolibri'

export const useLinks = () => {
  const store = useKolibriStore()

  const tzktLinkContract = (contract: string): string => {
    if (store.isSandbox) {
      return `https://bcd.hover.engineering/sandboxnet/${contract}`
    }
    return `https://tzkt.io/${contract}`
  }

  const tzktLinkTx = (opHash: string): string => {
    if (store.isSandbox) {
      return `https://bcd.hover.engineering/sandboxnet/opg/${opHash}`
    }
    return `https://tzkt.io/${opHash}`
  }

  const tzktAPILink = (): string | null => {
    if (store.isSandbox) return null
    return 'https://api.tzkt.io'
  }

  const bcdLink = (contract: string): string => {
    if (store.isSandbox) {
      return `https://bcd.hover.engineering/sandboxnet/${contract}`
    }
    return `https://better-call.dev/mainnet/${contract}`
  }

  const govLink = (): string => {
    if (store.isTestnet) return 'https://testnet-governance.kolibri.finance'
    if (store.isSandbox) return 'https://governance-sandbox.kolibri.finance'
    return 'https://governance.kolibri.finance'
  }

  return { tzktLinkContract, tzktLinkTx, tzktAPILink, bcdLink, govLink }
}
