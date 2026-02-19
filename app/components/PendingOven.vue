<template>
  <div class="box oven pending-oven">
    <div class="oven-info">
      <div class="is-flex is-flex-direction-row is-justify-content-center is-align-items-center">
        <h1 class="title is-marginless is-4">
          This oven is <a target="_blank" rel="noopener" :href="tzktLinkTx(opHash)">being built</a>
        </h1>
        <div class="loader"></div>
      </div>
      <br />
      <p class="heading">{{ opHash }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLinks } from '~/composables/useLinks'

defineProps<{ opHash: string }>()
const { tzktLinkTx } = useLinks()
</script>

<style lang="scss">
.pending-oven {
  .oven-info {
    text-align: center;
    padding: 2rem;
    .title {
      padding-right: 0.75rem;
    }
  }
}
</style>
