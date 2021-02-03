import Vue from 'vue'

import { WalletStates } from './enums'

import { CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, Network, TokenClient } from "@hover-labs/kolibri-js";

// const NODE_URL = 'https://tezos-dev.cryptonomic-infra.tech'
// const NODE_URL = 'https://testnet-tezos.giganode.io'

let NETWORK, NODE_URL, NETWORK_CONTRACTS, isTestnet
if (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'testnet.kolibri.finance') {
    NODE_URL = 'https://rpctest.tzbeta.net'
    NETWORK = Network.Delphi
    NETWORK_CONTRACTS = CONTRACTS.DELPHI
    isTestnet = true
} else {
    // NODE_URL = 'https://rpc.tzbeta.net'
    NODE_URL = 'https://tezos-prod.cryptonomic-infra.tech'
    NETWORK = Network.Mainnet
    NETWORK_CONTRACTS = CONTRACTS.MAIN
    isTestnet = false
}

export default Vue.observable({
    priceData: null,
    ovenCount: null,
    stabilityFee: null,
    collateralRate: null,
    ownedOvens: null,
    balanceData: null,
    wallet: null,
    walletAvailable: null,
    walletStates: WalletStates,
    walletState: WalletStates.DISCONNECTED,
    walletBalance: null,
    simpleStabilityFee: null,
    maxOvenValue: null,
    network: NETWORK,
    nodeURL: NODE_URL,
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
    NETWORK_CONTRACTS
})
