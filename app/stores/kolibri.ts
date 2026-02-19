import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import BigNumber from 'bignumber.js'
import {
  CONTRACTS,
  HarbingerClient,
  OvenClient,
  StableCoinClient,
  TokenClient,
  Network,
  SavingsPoolClient,
} from '~/lib/kolibri'
import { TezosToolkit } from '@taquito/taquito'
import { WalletStates } from '~/types'
import type { OvenData, PriceData, BalanceData, BakerInfo, WalletState, NetworkName } from '~/types'

const detectNetwork = (): { network: typeof Network[keyof typeof Network]; nodeURL: string; contracts: any; isTestnet: boolean; isSandbox: boolean } => {
  const hostname = window.location.hostname

  if (hostname === 'testnet.kolibri.finance') {
    return {
      network: Network.Hangzhou,
      nodeURL: 'https://ghostnet.ecadinfra.com',
      contracts: CONTRACTS.TEST,
      isTestnet: true,
      isSandbox: false,
    }
  }

  if (hostname === 'sandbox.kolibri.finance') {
    return {
      network: Network.Sandbox,
      nodeURL: 'https://sandbox.hover.engineering',
      contracts: CONTRACTS.SANDBOX,
      isTestnet: false,
      isSandbox: true,
    }
  }

  return {
    network: Network.Mainnet,
    nodeURL: 'https://mainnet.ecadinfra.com',
    contracts: CONTRACTS.MAIN,
    isTestnet: false,
    isSandbox: false,
  }
}

const buildFarmContracts = (contracts: any) => {
  const farms: Record<string, any> = {}

  if (contracts.FARMS.YOUVES_FLAT?.farm !== undefined) {
    farms['kUSD/uUSD Flat Curve LP'] = contracts.FARMS.YOUVES_FLAT.farm
  }

  farms['kUSD/XTZ Quipuswap LP'] = contracts.FARMS.KUSD_LP.farm
  farms['kUSD'] = contracts.FARMS.KUSD.farm
  farms['QLkUSD'] = contracts.FARMS.QLKUSD.farm

  return farms
}

const loadOvenNames = (): Record<string, string> => {
  const raw = localStorage.getItem('oven-names')
  if (raw === null) return {}
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.setItem('oven-names', '{}')
    return {}
  }
}

export const useKolibriStore = defineStore('kolibri', () => {
  const detected = detectNetwork()

  // Apply noindex for non-mainnet
  if (detected.isTestnet || detected.isSandbox) {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'robots')
    meta.content = 'noindex'
    document.head.appendChild(meta)
  }

  // Node URL override from localStorage
  const nodeOverrideKey = `${detected.network}-nodeOverride`
  const savedNodeURL = localStorage.getItem(nodeOverrideKey)
  const resolvedNodeURL = savedNodeURL || detected.nodeURL

  // Network
  const network = ref(detected.network)
  const nodeURL = ref(resolvedNodeURL)
  const isTestnet = ref(detected.isTestnet)
  const isSandbox = ref(detected.isSandbox)
  const NETWORK_CONTRACTS = ref(detected.contracts)
  const farmContracts = ref(buildFarmContracts(detected.contracts))

  // Blockchain state
  const currentBlockHeight = ref<number | null>(null)
  const allOvensData = ref<OvenData[] | null>(null)
  const priceData = ref<PriceData | null>(null)
  const ovenCount = ref<number | null>(null)
  const stabilityFee = ref<BigNumber | null>(null)
  const privateLiquidationThreshold = ref<BigNumber | null>(null)
  const collateralRate = ref<BigNumber | null>(null)
  const collateralOperand = ref<BigNumber | null>(null)
  const simpleStabilityFee = ref<BigNumber | null>(null)
  const debtCeiling = ref<BigNumber | null>(null)
  const balanceData = ref<BalanceData | null>(null)
  const daoStorage = ref<any>(null)

  // Wallet
  const wallet = ref<any>(null)
  const walletState = ref<WalletState>(WalletStates.DISCONNECTED)
  const walletPKH = ref<string | null>(null)
  const walletBalance = ref<BigNumber | null>(null)
  const walletBalanceXTZ = ref<BigNumber | null>(null)

  // Ovens
  const ownedOvens = ref<Record<string, OvenData> | null>(null)
  const ovenNames = ref<Record<string, string>>(loadOvenNames())

  // Holdings
  const stabilityFundHoldings = ref<BigNumber | null>(null)
  const devFundHoldings = ref<BigNumber | null>(null)
  const kdaoHoldings = ref<any>(null)

  // Liquidity pool
  const lpData = ref<any>(null)
  const lpBalance = ref<BigNumber | null>(null)
  const lpTokenAddress = ref<string | null>(null)
  const lpMantissa = ref(new BigNumber(10).pow(36))
  const lpDisabled = ref(true)

  // Bakers
  const bakers = ref<Record<string, BakerInfo> | null>(null)
  const defaultOvenBaker = ref<string | null>(null)

  // SDK clients
  const tezosToolkit = new TezosToolkit(resolvedNodeURL)
  const tokenClient = new TokenClient(resolvedNodeURL, detected.contracts.TOKEN)
  const harbingerClient = new HarbingerClient(
    resolvedNodeURL,
    detected.contracts.HARBINGER_NORMALIZER,
  )
  const stableCoinClient = new StableCoinClient(
    resolvedNodeURL,
    detected.network,
    detected.contracts.OVEN_REGISTRY,
    detected.contracts.MINTER,
    detected.contracts.OVEN_FACTORY,
    detected.network === Network.Sandbox ? 'https://bcd.hover.engineering' : undefined,
  )

  // Sandbox polling config
  if (detected.isSandbox) {
    tezosToolkit.setProvider({ config: { confirmationPollingIntervalSecond: 2 } })

    const sandboxOverrides = localStorage.getItem('sandbox-overrides')
    if (sandboxOverrides !== null) {
      try {
        const overrides = JSON.parse(sandboxOverrides)
        if (overrides.nodeURL) nodeURL.value = overrides.nodeURL
      } catch { /* ignore invalid JSON */ }
    }
  }

  const daoToken = ref(detected.contracts.DAO_TOKEN)

  // Computed
  const isMainnet = computed(() => !isTestnet.value && !isSandbox.value)

  // SDK client factories
  const getSavingsPoolClient = (walletInstance: any, poolAddress: string) =>
    new SavingsPoolClient(nodeURL.value, walletInstance, poolAddress)

  const getOvenClient = (walletInstance: any, ovenAddress: string) =>
    new OvenClient(nodeURL.value, walletInstance, ovenAddress, stableCoinClient, harbingerClient)

  return {
    // Network
    network,
    nodeURL,
    nodeOverrideKey,
    isTestnet,
    isSandbox,
    isMainnet,
    NETWORK_CONTRACTS,
    farmContracts,

    // Blockchain state
    currentBlockHeight,
    allOvensData,
    priceData,
    ovenCount,
    stabilityFee,
    privateLiquidationThreshold,
    collateralRate,
    collateralOperand,
    simpleStabilityFee,
    debtCeiling,
    balanceData,
    daoStorage,

    // Wallet
    wallet,
    walletState,
    walletStates: WalletStates,
    walletPKH,
    walletBalance,
    walletBalanceXTZ,

    // Ovens
    ownedOvens,
    ovenNames,

    // Holdings
    stabilityFundHoldings,
    devFundHoldings,
    kdaoHoldings,

    // LP
    lpData,
    lpBalance,
    lpTokenAddress,
    lpMantissa,
    lpDisabled,

    // Bakers
    bakers,
    defaultOvenBaker,

    // DAO
    daoToken,

    // SDK clients
    tezosToolkit,
    tokenClient,
    harbingerClient,
    stableCoinClient,
    getSavingsPoolClient,
    getOvenClient,
  }
})
