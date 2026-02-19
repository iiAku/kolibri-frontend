<template>
  <div class="recent-activity box is-flex is-align-items-center">
    <p class="title timestamp-title is-6 is-marginless">
      <a target="_blank" rel="noopener" :href="tzktLinkTx(tx.hash)">
        {{ formatDuration(now - new Date(tx.timestamp).getTime()) }} ago
        <span class="help">{{ tx.timestamp }}</span>
      </a>
    </p>
    <span class="action" v-if="tx.parameter.entrypoint === 'deposit'">
      Deposited <b>{{ formatNumber(parseInt(tx.parameter.value) / 1e18, 2) }} kUSD</b> for
      <span v-if="resolvedData !== null">
        <b>{{ formatNumber(resolvedData.parameter.value.value / 1e36, 2) }} KSR</b>
      </span>
      <span v-else class="loader is-inline-flex"></span>
    </span>
    <span class="action" v-else-if="tx.parameter.entrypoint === 'redeem'">
      Redeemed <b>{{ formatNumber(parseInt(tx.parameter.value) / 1e36, 2) }} KSR</b> for
      <span v-if="resolvedData !== null">
        <b>{{ formatNumber(resolvedData.parameter.value.value / 1e18, 2) }} kUSD</b>
      </span>
      <span v-else class="loader is-inline-flex"></span>
    </span>
    <span v-else>Unknown entrypoint! {{ tx.parameter.entrypoint }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useKolibriStore } from '~/stores/kolibri'
import { useLinks } from '~/composables/useLinks'
import { useFormatting } from '~/composables/useFormatting'

const props = defineProps<{
  tx: any
  now: number
}>()

const store = useKolibriStore()
const { tzktLinkTx, tzktAPILink } = useLinks()
const { formatNumber, formatDuration } = useFormatting()

const resolvedData = ref<any>(null)

onMounted(async () => {
  const apiLink = tzktAPILink()
  if (apiLink === null) return

  const response = await axios.get(`${apiLink}/v1/operations/${props.tx.hash}`)
  const operations: any[] = response.data

  if (props.tx.parameter.entrypoint === 'redeem') {
    resolvedData.value = operations.find(
      (op) =>
        op.parameter.entrypoint === 'transfer' &&
        op.parameter.value.to === store.walletPKH &&
        op.parameter.value.from === store.NETWORK_CONTRACTS.SAVINGS_POOL,
    )
  } else if (props.tx.parameter.entrypoint === 'deposit') {
    resolvedData.value = operations.find(
      (op) =>
        op.parameter.entrypoint === 'mint' &&
        op.parameter.value.address === store.walletPKH,
    )
  }
})
</script>

<style lang="scss">
.recent-activity {
  .action {
    margin-left: 1rem;
    .loader {
      vertical-align: middle;
    }
  }
}
</style>
