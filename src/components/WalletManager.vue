<template></template>

<script>
import { WalletStates } from "@/enums";
import { BeaconWallet } from "@taquito/beacon-wallet";
import BigNumber from "bignumber.js";
import {Network} from "@hover-labs/kolibri-js";

export default {
  name: 'WalletManager',
  async mounted(){
    this.$eventBus.$on('wallet-connect-request', this.connectWallet)
    this.$eventBus.$on('wallet-reconnect-request', this.reconnectWallet)

    this.beaconWallet = new BeaconWallet({
      name: "Kolibri",
      iconUrl: 'https://kolibri-data.s3.amazonaws.com/logo.png',
      appUrl: 'https://kolibri.finance',
    });

    // Go check for an active account, and if it exists just use that
    const activeAccount = await this.beaconWallet.client.getActiveAccount()
    if (activeAccount !== undefined){
      this.$eventBus.$emit('wallet-connect-request', activeAccount)
    }

    this.$eventBus.$on('refresh-holdings', async () => {
      this.$store.lpData = null
      this.$store.lpBalance = null
      this.$store.walletBalance = null
      await this.updateBalance()
    })

  },
  data(){
    return {
      updateTimer: null,
      beaconWallet: null,
    }
  },
  methods: {
    async updateBalance(){
      this.$store.walletBalance = await this.$store.tokenClient.getBalance(this.$store.walletPKH)
      this.$store.walletBalanceXTZ = await this.$store.tezosToolkit.tz.getBalance(this.$store.walletPKH)

      if (this.$store.lpData === null){
        const lpContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
        this.$store.lpData = await lpContract.storage()
        this.$store.lpTokenAddress = this.$store.lpData.tokenAddress
      }

      const currentLPBalance = await this.$store.lpData.balances.get(this.$store.walletPKH)

      if (currentLPBalance === undefined){
        this.$store.lpBalance = new BigNumber(0)
      } else {
        this.$store.lpBalance = currentLPBalance.balance
      }

    },
    async reconnectWallet(){
      try {
        await this.beaconWallet.clearActiveAccount()
        clearInterval(this.updateTimer)
        this.updateTimer = null
        this.$store.wallet = null
        this.$store.walletPKH = null
        this.$store.walletBalance = null
        this.$store.walletState = WalletStates.DISCONNECTED

        this.$eventBus.$emit('refresh-farms')

        await this.connectWallet()
      } catch (e) {
        if (e.name !== 'NotGrantedThanosWalletError') {
          throw e
        }
      }
    },
    async connectWallet(activeAccount) {
      try {
        if (activeAccount === undefined){
          await this.beaconWallet.requestPermissions({
            network: {
              type: this.$store.network === Network.Sandbox ? 'custom' : this.$store.network,
              rpcUrl: this.$store.nodeURL
            }
          })
        }

        this.$store.walletPKH = await this.beaconWallet.getPKH()
        this.$store.walletState = WalletStates.CONNECTED;
        this.$store.wallet = this.beaconWallet

        this.$eventBus.$emit('wallet-connected')
        this.$eventBus.$emit('refresh-all-ovens')
        // Update wallet balances for kUSD
        await this.updateBalance()
        this.updateTimer = setInterval(this.updateBalance, 60 * 1000)

        // Go get the default baker
        this.$store.tezosToolkit.setWalletProvider(this.$store.wallet)
        const ovenFactoryContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.OVEN_FACTORY)
        const ovenFactoryStorage = await ovenFactoryContract.storage()
        this.$store.defaultOvenBaker = ovenFactoryStorage.initialDelegate

      } catch(e) {
        this.beaconWallet.clearActiveAccount()
        console.error(e)
        this.$swal(
          "Could Not Connect",
          `We couldn't connect to Beacon 🙈!<br><pre class="has-text-left">${JSON.stringify(e, null, 2)}</pre>`,
          "error"
        );
        this.$store.walletState = WalletStates.ERROR;
      }
    },
  },
};
</script>

<style type="text/scss" lang="scss"></style>
