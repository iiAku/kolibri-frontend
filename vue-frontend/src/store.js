import Vue from 'vue'

import { WalletStates } from './enums'

import {CONTRACTS, HarbingerClient, OvenClient, StableCoinClient, Network, TokenClient} from "@tessellatedgeometry/stablecoin-lib";

// const NODE_URL = 'https://tezos-dev.cryptonomic-infra.tech'
// const NODE_URL = 'https://testnet-tezos.giganode.io'
const NODE_URL = 'https://rpctest.tzbeta.net'

const NETWORK = Network.Delphi

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
    network: NETWORK,
    nodeURL: NODE_URL,
    tokenClient: new TokenClient(NODE_URL, CONTRACTS.DELPHI.TOKEN),
    harbingerClient: new HarbingerClient(NODE_URL,
        CONTRACTS.DELPHI.HARBINGER_NORMALIZER
    ),
    stableCoinClient: new StableCoinClient(NODE_URL,
        NETWORK,
        CONTRACTS.DELPHI.OVEN_REGISTRY,
        CONTRACTS.DELPHI.MINTER,
        CONTRACTS.DELPHI.OVEN_FACTORY
    ),
    getOvenClient(wallet, ovenAddress){
        return new OvenClient(NODE_URL, wallet, ovenAddress, this.stableCoinClient, this.harbingerClient)
    }
})
