<template></template>

<script>
import { ThanosWallet } from "@thanos-wallet/dapp";
import { WalletStates } from "@/enums";

export default {
  name: 'WalletManager',
  async mounted(){
    ThanosWallet.onAvailabilityChange(async (available) => {
      this.$store.walletAvailable = available
      if (window.localStorage.getItem('walletPreviouslyConnected') === 'true') {
        await this.connectWallet()
      }
    })

    this.$eventBus.$on('wallet-connect-request', this.connectWallet)
    this.$eventBus.$on('wallet-reconnect-request', this.reconnectWallet)
  },
  data(){
    return {
      updateTimer: null
    }
  },
  methods: {
    async updateBalance(){
      this.$store.walletBalance = await this.$store.tokenClient.getBalance(this.$store.wallet.permission.pkh)
    },
    async reconnectWallet(){
      console.log("Reconnecting wallet!")
      try {
        await this.$store.wallet.reconnect(this.$store.network)
        await this.updateBalance()
        this.$eventBus.$emit('refresh-all-ovens')
      } catch (e) {
        if (e.name !== 'NotGrantedThanosWalletError') {
          throw e
        }
      }
    },
    async connectWallet() {
      console.log("Connecting wallet!");
      window.localStorage.setItem('walletPreviouslyConnected', 'true')
      this.$store.walletState = WalletStates.CONNECTING;
      const wallet = new ThanosWallet("Kolibri");
      await wallet.connect(this.$store.network)
        .then(async () => {
          this.$store.walletState = WalletStates.CONNECTED;
          this.$store.wallet = wallet;

          // Update wallet balances for kUSD
          await this.updateBalance()
          this.updateTimer = setInterval(this.updateBalance, 60 * 1000)

          // Go get the default baker
          const tez = wallet.toTezos()
          const ovenFactoryContract = await tez.wallet.at(this.$store.NETWORK_CONTRACTS.OVEN_FACTORY)
          const ovenFactoryStorage = await ovenFactoryContract.storage()
          this.$store.defaultOvenBaker = ovenFactoryStorage.initialDelegate
        })
        .catch((err) => {
          // Use sweetalert2
          this.$swal(
            "Could Not Connect",
            `We couldn't connect to Thanos Wallet 🙈!<br><pre class="has-text-left">${JSON.stringify(
              err,
              null,
              2
            )}</pre>`,
            "error"
          );
          this.$store.walletState = WalletStates.ERROR;
        });
    },
  },
};
</script>

<style type="text/scss" lang="scss"></style>
