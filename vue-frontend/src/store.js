import Vue from 'vue'

import { WalletStates } from './enums'

import { CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, Network, TokenClient } from "@hover-labs/kolibri-js";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";

const FORCE_MAINNET = false

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet, farmContracts, daoToken
if ((window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://rpctest.tzbeta.net'
    NETWORK = 'edonet'
    NETWORK_CONTRACTS = CONTRACTS.TEST
    isTestnet = true

    farmContracts = {
        'kUSD': 'KT1Sc3BkMMeJawhrwyghNnJzpVN2Udswet91',
        'QLPkUSD': 'KT1C4kFZ2Y4AUeRXk98tcf7Rt2Gu93Nch7Xd',
    }

    daoToken = 'KT18yyUYL7U9eGfjukKqhY9THqugmh1oW6Fh'

    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
} else if (window.location.hostname === 'zeronet.kolibri.finance') {
    NODE_URL = 'https://testnet-tezos.giganode.io'
    NETWORK = 'florencenet'
    NETWORK_CONTRACTS = CONTRACTS.ZERO
    isTestnet = true

    farmContracts = {}
    daoToken = ''

    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
} else {
    NODE_URL = 'https://rpc.tzbeta.net'
    // NODE_URL = 'https://mainnet-tezos.giganode.io'
    NETWORK = Network.Mainnet
    NETWORK_CONTRACTS = CONTRACTS.MAIN
    isTestnet = false

    farmContracts = {}
    daoToken = ''
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

export default Vue.observable({
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
    lpContract: NETWORK_CONTRACTS.LIQUIDITY_POOL,
    ovenNames: ovenNames,
    network: NETWORK,
    nodeURL: NODE_URL,
    tezosToolkit: new TezosToolkit(NODE_URL),
    tokenClient: new TokenClient(NODE_URL, NETWORK_CONTRACTS.TOKEN),
    harbingerClient: new HarbingerClient(NODE_URL,
        NETWORK_CONTRACTS.HARBINGER_NORMALIZER
    ),
    stableCoinClient: new StableCoinClient(NODE_URL,
        NETWORK,
        NETWORK_CONTRACTS.OVEN_REGISTRY,
        NETWORK_CONTRACTS.MINTER,
        NETWORK_CONTRACTS.OVEN_FACTORY
    ),
    getOvenClient(wallet, ovenAddress) {
        return new OvenClient(NODE_URL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    },
    isTestnet,
    NETWORK_CONTRACTS,
    farmContracts,
    daoToken
})
