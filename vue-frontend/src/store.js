import Vue from 'vue'

import { WalletStates } from './enums'

import { CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, TokenClient, Network } from "@hover-labs/kolibri-js";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import _ from 'lodash'

const FORCE_MAINNET = false

function dontIndexTestnets(){
    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
}

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet, farmContracts, isSandbox
if ((window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://testnet-tezos.giganode.io'
    NETWORK = Network.Florence
    NETWORK_CONTRACTS = CONTRACTS.TEST
    isTestnet = true
    isSandbox = false

    farmContracts = {
        'kUSD Quipu LP': NETWORK_CONTRACTS.FARMS.KUSD_LP.farm,
        'kUSD': NETWORK_CONTRACTS.FARMS.KUSD.farm,
        'QLPkUSD': NETWORK_CONTRACTS.FARMS.QLKUSD.farm,
    }

    dontIndexTestnets()
} else if (
    // window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'sandbox.kolibri.finance') {
    NODE_URL = 'http://127.0.0.1:8732'
    NETWORK = Network.Sandbox

    NETWORK_CONTRACTS  = {
        MINTER: "KT1WoJNcdahhq767m3Sbwdd2GBY6Y9MEPaq6",
        OVEN_PROXY: "KT1TNBZ1swd3h5WBA7RiDP2xTeGbAk3XLRua",
        OVEN_FACTORY: "KT19Li9kJ7zioJ9DUfsvTKwSMmWW5aruHtBW",
        TOKEN: "KT1LU771Mf1Qbpz69Ed7Tt8JdkxZJnKhW1sP",
        OVEN_REGISTRY: "KT19dyTijSBa4vWQYqSS1wJibndQ4jSHVhB1",
        DEVELOPER_FUND: "KT1Cz1vfanKTSMe2MMYSmBkLUK2Gh6EoVVgA",
        STABILITY_FUND: "KT1A3byBQZmoXbL3Tei6oZBV2komH8vnMEAt",
        ORACLE: "KT1V93P9QvzvNxbt98cSEMmGuo4DiwZfX9xq",
        HARBINGER_NORMALIZER: 'KT1MyzVhLxNEuuK2g6gkqnNJky24ZBsBg7kj',
        LIQUIDITY_POOL: "KT1MVwgSoNUNS717ypAPFc4USteWm1g33czN",
        DEXTER_POOL: '',
        QUIPUSWAP_POOL: "KT1UTS2tZQHdtq8NDHKfZT4w1bwGRc1Xctgw",
        KOLIBRI_BAKER: 'tz3WXYtyDUNL91qfiCJtVUX746QpNv5i5ve5',
        GOVERNOR: '',
        PAUSE_GUARDIAN: '',
        FUND_ADMIN: '',
    }

    isTestnet = true
    isSandbox = true

    farmContracts = {
        'QLPkUSD': 'KT1QM5uKDCkEDNoXubRiYou7p92KKkxrTQUV',
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
    // NODE_URL = 'https://rpc.tzbeta.net'
    NODE_URL = 'https://mainnet-tezos.giganode.io'
    NETWORK = Network.Mainnet
    NETWORK_CONTRACTS = CONTRACTS.MAIN
    isTestnet = false
    isSandbox = false

    farmContracts = {}
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

if (NETWORK === Network.Sandbox){
    const sandboxOverrides = localStorage.getItem('sandbox-overrides')
    if (sandboxOverrides !== null){
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
        NETWORK === Network.Sandbox ? 'http://127.0.0.1:8000' : undefined
    ),
    getOvenClient(wallet, ovenAddress) {
        return new OvenClient(state.nodeURL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    },
})

export default state
