import Vue from 'vue'

import { WalletStates } from './enums'

import { CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, TokenClient, Network } from "@hover-labs/kolibri-js";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import _ from 'lodash'

// const FORCE_MAINNET = true
const FORCE_MAINNET = false

function dontIndexTestnets() {
    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
}

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet, farmContracts, isSandbox
if ((window.location.hostname === 'localhost' ||
    // window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://testnet-tezos.giganode.io'
    NETWORK = Network.Granada
    NETWORK_CONTRACTS = CONTRACTS.TEST
    isTestnet = true
    isSandbox = false

    farmContracts = {
        'kUSD Quipu LP': NETWORK_CONTRACTS.FARMS.KUSD_LP.farm,
        'kUSD': NETWORK_CONTRACTS.FARMS.KUSD.farm,
        'QLkUSD': NETWORK_CONTRACTS.FARMS.QLKUSD.farm,
    }

    dontIndexTestnets()
} else if ((
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'sandbox.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://sandbox.hover.engineering'
    NETWORK = 'sandbox'

    NETWORK_CONTRACTS = {
        TOKEN: "KT1LrCSMUKKyZwhnKh9EXhvTspJ4YP1et95U",
        ORACLE: "KT1PKen2GEgadnzzvxhSCNmAZc2EKKzssUYv",
        HARBINGER_NORMALIZER: 'KT1LV3DjqarkgQ4PvCZCgbAKYi438WYcehTu',
        DEVELOPER_FUND: "KT1BEDFemDcC5K6QYVXF2oW6bcjw2Q9yVchw",
        STABILITY_FUND: "KT1DaCndUJwZzCr7BiZRH8mxr6mpPu88mJpe",
        OVEN_REGISTRY: "KT1NeEZDA2HuLpuhwRJ4fZ7sqcYfgxpGBoya",
        OVEN_FACTORY: "KT1CmUwZTtHFgoELFbipZKKR1X3WPz88Zdnh",
        OVEN_PROXY: "KT1C39aEForRcXyjw1sHwSThX1tKHnTxRUdo",
        MINTER: "KT1Vwqaf7RCKfzcQ6r6JpQN1cWmy6Z2z2qu1",
        LIQUIDITY_POOL: "KT1LgMkgxNiNoRc6niDjcjwBCnFJMsET8LNq",
        QUIPUSWAP_POOL: "KT1N3YZz4yq732Jdy7BSEWbFsSvvoTDFa1si",
    }

    isTestnet = false
    isSandbox = true

    farmContracts = {
        'kUSD': 'KT1M97HUZBVibMipbNdk3qTxaaYpnEsvnonY',
        'QLkUSD': 'KT1Rdit9FA79UbDebKmd6oYcTigXiTZkk9vS',
        'kUSD Quipu LP': 'KT1T5dQ2839MUXF6DqwgD1gMdHi3nCDqqmmQ'
    }

    dontIndexTestnets()
} else if (window.location.hostname === 'zeronet.kolibri.finance') {
    NODE_URL = 'https://rpczero.tzbeta.net'
    NETWORK = Network.Granada
    NETWORK_CONTRACTS = CONTRACTS.ZERO
    isTestnet = true
    isSandbox = false

    farmContracts = {}

    dontIndexTestnets()
} else {
    NODE_URL = 'https://rpc.tzbeta.net'
    // NODE_URL = 'https://mainnet-tezos.giganode.io'
    NETWORK = Network.Mainnet
    NETWORK_CONTRACTS = CONTRACTS.MAIN
    isTestnet = false
    isSandbox = false

    farmContracts = {
        'kUSD Quipu LP': NETWORK_CONTRACTS.FARMS.KUSD_LP.farm,
        'kUSD': NETWORK_CONTRACTS.FARMS.KUSD.farm,
        'QLkUSD': NETWORK_CONTRACTS.FARMS.QLKUSD.farm,
    }
}

const ovenNameMapping = window.localStorage.getItem('oven-names')
let ovenNames
if (ovenNameMapping !== null) {
    try {
        ovenNames = JSON.parse(ovenNameMapping)
    } catch (e) {
        // There's a problem loading oven names
        localStorage.setItem('oven-names', null)
        ovenNames = {}
    }
} else {
    ovenNames = {}
}

NODE_URL = localStorage.getItem('nodeOverride') ? localStorage.getItem('nodeOverride') : NODE_URL

let state = Vue.observable({
    currentBlockHeight: null,
    allOvensData: null,
    priceData: null,
    ovenCount: null,
    stabilityFee: null,
    collateralRate: null,
    ownedOvens: null,
    balanceData: null,
    wallet: null,
    walletStates: WalletStates,
    walletState: WalletStates.DISCONNECTED,
    walletPKH: null,
    walletBalance: null,
    walletBalanceXTZ: null,
    simpleStabilityFee: null,
    stabilityFundHoldings: null,
    devFundHoldings: null,
    kdaoHoldings: null,
    maxOvenValue: null,
    debtCeiling: null,
    bakers: null,
    defaultOvenBaker: null,
    lpData: null,
    lpBalance: null,
    lpTokenAddress: null,
    lpMantissa: new BigNumber(10).pow(36),
    ovenNames: ovenNames,
    network: NETWORK,
    nodeURL: NODE_URL,
    daoToken: NETWORK_CONTRACTS.DAO_TOKEN,
    isTestnet,
    isSandbox,
    NETWORK_CONTRACTS,
    farmContracts,
})

if (NETWORK === 'sandbox') {
    const sandboxOverrides = localStorage.getItem('sandbox-overrides')
    if (sandboxOverrides !== null) {
        const newState = JSON.parse(sandboxOverrides)
        state = _.merge(state, newState)
    }
}

state = _.merge(state, {
    tezosToolkit: new TezosToolkit(state.nodeURL),
    tokenClient: new TokenClient(state.nodeURL, state.NETWORK_CONTRACTS.TOKEN),
    harbingerClient: new HarbingerClient(state.nodeURL,
        state.NETWORK_CONTRACTS.HARBINGER_NORMALIZER
    ),
    stableCoinClient: new StableCoinClient(state.nodeURL,
        state.network,
        state.NETWORK_CONTRACTS.OVEN_REGISTRY,
        state.NETWORK_CONTRACTS.MINTER,
        state.NETWORK_CONTRACTS.OVEN_FACTORY,
        // If on our sandbox, load from
        NETWORK === 'sandbox' ? 'https://bcd.hover.engineering' : undefined
    ),
    getOvenClient(wallet, ovenAddress) {
        return new OvenClient(state.nodeURL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    },
})

export default state
