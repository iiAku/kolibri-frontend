import Vue from 'vue'

import { WalletStates } from './enums'

import { CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, TokenClient } from "@hover-labs/kolibri-js";
import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import _ from 'lodash'
import axios from "axios";

const FORCE_MAINNET = false

const NETWORKS = {
    FLORENCE: 'florencenet',
    GRANADA: 'granada',
    MAINNET: 'mainnet',
    SANDBOX: 'custom',
}

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet, farmContracts, daoToken
if ((window.location.hostname === 'localhost' ||
    // window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') && !FORCE_MAINNET) {
    NODE_URL = 'https://testnet-tezos.giganode.io'
    NETWORK = NETWORKS.FLORENCE
    NETWORK_CONTRACTS = CONTRACTS.TEST
    isTestnet = true

    farmContracts = {
        // 'kUSD': 'KT1JwAnSkTs7ios7bawaH6Jd63KuZKC1SvkV',
        'QLPkUSD': 'KT1QM5uKDCkEDNoXubRiYou7p92KKkxrTQUV',
    }

    daoToken = 'KT1Ssn1Rnr1v2WM7yzrZ83GeAhwhq6eUy4nn'

    // If we're in testnet tell google not to index
    const link = document.createElement('meta');
    link.setAttribute('name', 'robots');
    link.content = 'noindex';
    document.getElementsByTagName('head')[0].appendChild(link);
} else if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'sandbox.kolibri.finance') {
    NODE_URL = 'http://127.0.0.1:8732'
    NETWORK = NETWORKS.SANDBOX

    NETWORK_CONTRACTS = {
        MINTER: 'KT1KhomMwK5d7sjghhDyebvKUxdvJgQCscee',
        OVEN_PROXY: 'KT1DsjoX7zwVfbHfJStjTo68UuKzGMBjrDNz',
        OVEN_FACTORY: 'KT1STaHAXioC2XdAsqhk9rfrum1H4aswxEpk',
        TOKEN: 'KT1BC9gxekvbkUuj8xjg1dbwBCeAuychrVQR',
        OVEN_REGISTRY: 'KT1BTgHWXCCw4eUFS4kW6vAMr8FDhe6rEGMZ',
        DEVELOPER_FUND: 'KT19mehrceXVeg2JYCvpzHzDDk9C9r9NryL3',
        STABILITY_FUND: 'KT1KZMVUqY6rrhEQvNjoXYt2xYjWKhDGUQRB',
        ORACLE: 'KT1UcuWFCFKhZ4xYYwuVD29fCLX5S5xbW37u',
        HARBINGER_NORMALIZER: 'KT1MyzVhLxNEuuK2g6gkqnNJky24ZBsBg7kj',
        LIQUIDITY_POOL: 'KT1TTQL5Pv8KKfRDwXhsozNpLFAA76kzogiL',
        DEXTER_POOL: '',
        QUIPUSWAP_POOL: 'KT1MHhqWBK1aaCQdAQ1YLkuZyK8J1JJJBDuR',
        KOLIBRI_BAKER: 'tz3WXYtyDUNL91qfiCJtVUX746QpNv5i5ve5',
        GOVERNOR: '',
        PAUSE_GUARDIAN: '',
        FUND_ADMIN: '',
    }

    isTestnet = true

    farmContracts = {
        'QLPkUSD': 'KT1QM5uKDCkEDNoXubRiYou7p92KKkxrTQUV',
    }

    daoToken = 'KT1SXZcLmdvTbfCnNvGWYeq6y1yXehcA2MAw'

} else if (window.location.hostname === 'zeronet.kolibri.finance') {
    NODE_URL = 'https://rpczero.tzbeta.net'
    NETWORK = NETWORKS.GRANADA
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
    NETWORK = NETWORKS.MAINNET
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
    isTestnet,
    NETWORK_CONTRACTS,
    farmContracts,
    daoToken
})

if (NETWORK === NETWORKS.SANDBOX){
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
        state.NETWORK_CONTRACTS.OVEN_FACTORY
    ),
    getOvenClient(wallet, ovenAddress) {
        return new OvenClient(state.nodeURL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    },
})

if (NETWORK === NETWORKS.SANDBOX){
    // If we're in sandbox mode go solicit things from the local indexer instead of S3
    state.stableCoinClient['getAllOvens'] = async () => {
        const ovenRegistryContract = await state.tezosToolkit.contract.at(
            state.NETWORK_CONTRACTS.OVEN_REGISTRY,
        )
        const ovenRegistryStorage = await ovenRegistryContract.storage()
        const ovenRegistryBigMapId = await ovenRegistryStorage.ovenMap

        const values = await axios.get(`http://127.0.0.1:8000/v1/bigmap/sandboxnet/${ovenRegistryBigMapId}/keys?size=10`)

        return values.data.map((value) => {
            return {
                ovenAddress: value.data.key.value,
                ovenOwner: value.data.value.value,
            }
        })
    }
}

export default state
