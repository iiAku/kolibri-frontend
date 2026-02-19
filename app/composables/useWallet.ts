import { useKolibriStore } from '~/stores/kolibri'
import { WalletStates } from '~/types'

export const useWallet = () => {
  const store = useKolibriStore()

  const ovenClient = (ovenAddress: string) =>
    store.getOvenClient(store.wallet, ovenAddress)

  const validBakerAddress = (address: string | null): boolean =>
    address === null || address === '' || address.length === 36

  const calculateSandboxStabFeeTime = (): Date => {
    const epochTimeSeconds = new Date('Mon 06 Sep 2021 04:07:58 PM GMT-0400').getTime() / 1000
    const epochBlock = 17397
    const blockDiff = store.currentBlockHeight! - epochBlock
    const newFakeTimestamp = epochTimeSeconds - (blockDiff * 4)
    return new Date(newFakeTimestamp * 1000)
  }

  return {
    ovenClient,
    validBakerAddress,
    calculateSandboxStabFeeTime,
  }
}
