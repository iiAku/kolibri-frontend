<template>
  <section class="connect-prompt">
    <h1 class="title">Connect Your Wallet To Manage Your Ovens 👩‍🍳</h1>
    <button
        :disabled="$store.walletState === WalletStates.CONNECTING"
        :class="{'is-loading': $store.walletState === WalletStates.CONNECTING}"
        @click="$eventBus.$emit('wallet-connect-request')"
        class="button is-primary has-text-weight-bold is-large"
    >
      Connect To Wallet
    </button>
  </section>
</template>

<script>
import {WalletStates} from "@/enums";

export default {
  name: 'ConnectPrompt',
  async mounted(){
  },
  data: function () {
    return {
      WalletStates,
    }
  },
  components: {

  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .connect-prompt {
    background: $light-grey;
    padding: 2rem 2rem 4rem;
    text-align: center;
  }
</style>
