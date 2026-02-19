<template>
  <section class="connect-prompt">
    <h1 class="title">Connect Your Wallet To Manage Your Ovens</h1>
    <button
      @click="$eventBus.emit('wallet-connect-request')"
      class="button is-primary has-text-weight-bold is-large"
    >
      Connect To Wallet
    </button>
  </section>
</template>

<script setup lang="ts">
const { $eventBus } = useNuxtApp()
</script>

<style lang="scss">
.connect-prompt {
  background: $light-grey;
  padding: 2rem 2rem 4rem;
  text-align: center;
}
</style>
