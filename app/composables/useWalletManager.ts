import { ref, onMounted, onUnmounted } from 'vue'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { NetworkType } from '@airgap/beacon-types'
import BigNumber from 'bignumber.js'
import { Network } from '~/lib/kolibri'
import { useKolibriStore } from '~/stores/kolibri'
import { WalletStates } from '~/types'

BigNumber.set({ DECIMAL_PLACES: 36 })

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const useWalletManager = () => {
  const store = useKolibriStore()
  const { $eventBus, $swal } = useNuxtApp()

  const beaconWallet = ref<BeaconWallet | null>(null)
  let updateTimer: ReturnType<typeof setInterval> | null = null

  const updateBalance = async () => {
    store.walletBalance = await store.tokenClient.getBalance(store.walletPKH!)
    store.walletBalanceXTZ = await store.tezosToolkit.tz.getBalance(store.walletPKH!)

    if (store.lpData === null) {
      const lpContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
      store.lpData = await lpContract.storage()
      store.lpTokenAddress = store.lpData.tokenAddress
    }

    const currentLPBalance = await store.lpData.balances.get(store.walletPKH!)

    if (currentLPBalance === undefined) {
      store.lpBalance = new BigNumber(0)
    } else {
      store.lpBalance = currentLPBalance.balance
    }
  }

  const connectWallet = async (activeAccount?: any) => {
    try {
      if (activeAccount === undefined) {
        await beaconWallet.value!.requestPermissions()
      }

      store.walletPKH = await beaconWallet.value!.getPKH()
      store.walletState = WalletStates.CONNECTED
      store.wallet = beaconWallet.value

      $eventBus.emit('wallet-connected')
      $eventBus.emit('refresh-all-ovens')

      await updateBalance()
      updateTimer = setInterval(updateBalance, 60 * 1000)

      store.tezosToolkit.setWalletProvider(store.wallet)
      const ovenFactoryContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.OVEN_FACTORY)
      const ovenFactoryStorage = await ovenFactoryContract.storage() as any
      store.defaultOvenBaker = ovenFactoryStorage.initialDelegate
    } catch (e: any) {
      await beaconWallet.value!.clearActiveAccount()
      $swal.fire(
        'Could Not Connect',
        `We couldn't connect to Beacon!<br><pre class="has-text-left">${escapeHtml(JSON.stringify(e, null, 2))}</pre>`,
        'error',
      )
      store.walletState = WalletStates.ERROR
    }
  }

  const reconnectWallet = async () => {
    try {
      await beaconWallet.value!.clearActiveAccount()
      if (updateTimer) {
        clearInterval(updateTimer)
        updateTimer = null
      }
      store.wallet = null
      store.walletPKH = null
      store.walletBalance = null
      store.walletState = WalletStates.DISCONNECTED

      $eventBus.emit('refresh-farms')

      await connectWallet()
    } catch (e: any) {
      if (e.name !== 'NotGrantedThanosWalletError') {
        throw e
      }
    }
  }

  const onRefreshHoldings = async () => {
    store.lpData = null
    store.lpBalance = null
    store.walletBalance = null
    await updateBalance()
  }

  const beaconNetworkType = (): NetworkType => {
    if (store.network === Network.Sandbox) return NetworkType.CUSTOM
    if (store.network === Network.Hangzhou) return NetworkType.GHOSTNET
    return NetworkType.MAINNET
  }

  onMounted(async () => {
    $eventBus.on('wallet-connect-request', connectWallet)
    $eventBus.on('wallet-reconnect-request' as any, reconnectWallet)
    $eventBus.on('refresh-holdings' as any, onRefreshHoldings)

    beaconWallet.value = new BeaconWallet({
      name: 'Kolibri',
      iconUrl: 'https://kolibri-data.s3.amazonaws.com/logo.png',
      appUrl: 'https://kolibri.finance',
      network: {
        type: beaconNetworkType(),
        rpcUrl: store.nodeURL,
      },
    })

    const activeAccount = await beaconWallet.value.client.getActiveAccount()
    if (activeAccount !== undefined) {
      $eventBus.emit('wallet-connect-request' as any, activeAccount)
    }
  })

  onUnmounted(() => {
    $eventBus.off('wallet-connect-request', connectWallet)
    $eventBus.off('wallet-reconnect-request' as any, reconnectWallet)
    $eventBus.off('refresh-holdings' as any, onRefreshHoldings)
    if (updateTimer) clearInterval(updateTimer)
  })
}
