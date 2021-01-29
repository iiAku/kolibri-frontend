<template></template>

<script>
import { ThanosWallet } from "@thanos-wallet/dapp";
import { WalletStates } from "@/enums";

import { Network } from "@tessellatedgeometry/stablecoin-lib";

export default {
  name: "WalletManager",
  async mounted() {
    setTimeout(async () => {
      this.$store.walletAvailable = await ThanosWallet.isAvailable();
    }, 100);

    this.$eventBus.$on("wallet-connect-request", this.connectWallet);
  },
  methods: {
    async updateBalance() {
      this.$store.walletBalance = await this.$store.tokenClient.getBalance(
        this.$store.wallet.pkh
      );
    },
    async connectWallet() {
      console.log("Connecting wallet!");
      this.$store.walletState = WalletStates.CONNECTING;
      const wallet = new ThanosWallet("Kolibri");
      await wallet
        .connect({
          name: Network.Delphi,
          rpc: this.$store.nodeURL,
        })
        .then(async () => {
          this.$store.walletState = WalletStates.CONNECTED;
          this.$store.wallet = wallet;

          // Update wallet balances for kUSD
          await this.updateBalance();
          setInterval(this.updateBalance, 60 * 1000);
        })
        .catch((err) => {
          console.log("Errored :( ");
          console.error(err);
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
