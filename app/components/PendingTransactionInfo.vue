<template>
  <div v-if="show" class="pending-tx-info animate__animated animate__fadeInRight">
    <h4 class="has-text-weight-bold has-text-white is-flex is-align-items-center">
      Pending Transaction
      <div class="loader is-white is-inline-block"></div>
    </h4>
    <a target="_blank" rel="noopener" :href="tzktLinkTx(currentTx!)" class="has-text-white">
      {{ truncateChars(currentTx!, 20) }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLinks } from '~/composables/useLinks'
import { useFormatting } from '~/composables/useFormatting'

const { $eventBus } = useNuxtApp()
const { tzktLinkTx } = useLinks()
const { truncateChars } = useFormatting()

const show = ref(false)
const currentTx = ref<string | null>(null)

const onTxSubmitted = (operation: any) => {
  currentTx.value = operation.opHash
  show.value = true
}

const onTxFinished = () => {
  currentTx.value = null
  show.value = false
}

onMounted(() => {
  $eventBus.on('tx-submitted', onTxSubmitted)
  $eventBus.on('tx-finished', onTxFinished)
})

onUnmounted(() => {
  $eventBus.off('tx-submitted', onTxSubmitted)
  $eventBus.off('tx-finished', onTxFinished)
})
</script>

<style lang="scss">
.pending-tx-info {
  background: $primary;
  padding: 1rem;
  position: fixed;
  bottom: 0;
  right: 1rem;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  z-index: 100;
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-right: 2px solid white;
  .loader {
    margin-left: 0.5rem;
  }
}
</style>
