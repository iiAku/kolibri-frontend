<template>
  <div>
    <div id="manage-modal"></div>
    <div id="delegate-modal"></div>
    <div id="new-oven-modal"></div>
    <div id="project-info-modal"></div>

    <PendingTransactionInfo />
    <Options />
    <SandboxOverrides v-if="store.isSandbox" />
    <Navbar />
    <NuxtPage />
    <HoverLabsFooter />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useKolibriStore } from '~/stores/kolibri'
import { usePolling } from '~/composables/usePolling'
import { useWalletManager } from '~/composables/useWalletManager'

const store = useKolibriStore()
const {
  updatePriceInfo,
  updateAllOvenData,
  updateBlockHeight,
  updateMinterData,
  loadDAOStorage,
  startPolling,
  stopPolling,
} = usePolling()

useWalletManager()

onMounted(async () => {
  await Promise.all([
    updateBlockHeight(),
    updateMinterData(),
    updatePriceInfo(),
    updateAllOvenData(),
    loadDAOStorage(),
  ])
  store.simpleStabilityFee = await store.stableCoinClient.getSimpleStabilityFee()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>
