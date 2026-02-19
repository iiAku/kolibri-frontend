<template>
  <div class="peg-visualizer">
    <div v-if="store.priceData === null || quipuData === null" class="loader-wrapper">
      <div class="loader is-medium"></div>
    </div>

    <div v-else>
      <div class="peg-bar">
        <div class="ticks">
          <div :key="n" v-for="n in 21" class="tick"></div>
        </div>
        <div :style="{ opacity: currentPegPercent.isLessThan(0) ? 1 : 0 }" class="negative-peg">
          <div
            class="peg-progress"
            :class="[pegProgressClass, { full: Math.abs(currentPegPercent.toNumber()) * 10 >= 100 }]"
            :style="{ width: `${Math.min(Math.abs(currentPegPercent.toNumber()) * 10, 100)}%` }"
          >
            <div class="peg-indicator">
              <p class="heading">{{ currentPegPercent.toFixed(1) }}%</p>
            </div>
          </div>
        </div>
        <div :style="{ opacity: currentPegPercent.isGreaterThan(0) ? 1 : 0 }" class="positive-peg">
          <div
            class="peg-progress"
            :class="[pegProgressClass, { full: Math.abs(currentPegPercent.toNumber()) * 10 >= 100 }]"
            :style="{ width: `${Math.min(Math.abs(currentPegPercent.toNumber()) * 10, 100)}%` }"
          >
            <div class="peg-indicator">
              <p class="heading">{{ currentPegPercent.toFixed(1) }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BigNumber from 'bignumber.js'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'

const emit = defineEmits<{
  'peg-stats': [stats: { deltaForPeg: any; currentPegPercent: BigNumber; currentkUSDPrice: string; pegProgressClass: string }]
}>()

const store = useKolibriStore()
const { formatNumber } = useFormatting()

const quipuData = ref<any>(null)

const deltaForPeg = computed(() => {
  const tezPool = quipuData.value.storage.tez_pool
  const tokenPool = quipuData.value.storage.token_pool
  const invariant = tezPool.times(tokenPool)
  const kUSDMantissa = new BigNumber(10).pow(18)
  const tezMantissa = new BigNumber(10).pow(6)
  const conversionMantissa = new BigNumber(10).pow(12)

  const quipuPrice = tokenPool.dividedBy(tezPool).dividedBy(conversionMantissa)
  const harbingerPrice = store.priceData!.price.div(tezMantissa)
  const percentOff = new BigNumber(1).minus(harbingerPrice.dividedBy(quipuPrice))
  const halfPercentOff = percentOff.dividedBy(store.collateralOperand!)
  const kusdToRecv = tokenPool.times(halfPercentOff)

  const onePercentOff = new BigNumber('0.01').dividedBy(store.collateralOperand!)
  const pegDepth = tokenPool.times(onePercentOff)

  const updatedTokenPoolAmt = tokenPool.minus(kusdToRecv)
  const updatedTezPoolAmt = invariant.dividedBy(updatedTokenPoolAmt)
  const tezInput = updatedTezPoolAmt.minus(tezPool).dividedBy(tezMantissa)

  return { kUSD: kusdToRecv.dividedBy(kUSDMantissa), xtz: tezInput, pegDepth }
})

const currentPegPercent = computed(() => {
  const quipuPrice = quipuData.value.storage.token_pool.div(quipuData.value.storage.tez_pool).div(1e12)
  return store.priceData!.price.div(1e6).dividedBy(quipuPrice).minus(1).times(100)
})

const currentkUSDPrice = computed(() => {
  if (currentPegPercent.value.isNegative()) {
    return new BigNumber(1).minus(currentPegPercent.value.div(100).abs()).toFixed(2)
  }
  return new BigNumber(1).plus(currentPegPercent.value.div(100).abs()).toFixed(2)
})

const pegProgressClass = computed(() => {
  if (currentPegPercent.value.abs().isLessThanOrEqualTo(5)) return 'green'
  if (currentPegPercent.value.abs().isLessThanOrEqualTo(7.5)) return 'yellow'
  return 'red'
})

watch([() => store.priceData, () => store.collateralOperand], async ([priceData, collateralOperand]) => {
  if (priceData === null || collateralOperand === null) return
  const quipuContract = await store.tezosToolkit.contract.at(store.NETWORK_CONTRACTS.DEXES.QUIPUSWAP.POOL)
  quipuData.value = await quipuContract.storage()
  emit('peg-stats', {
    deltaForPeg: deltaForPeg.value,
    currentPegPercent: currentPegPercent.value,
    currentkUSDPrice: currentkUSDPrice.value,
    pegProgressClass: pegProgressClass.value,
  })
})
</script>

<style lang="scss">
.peg-visualizer {
  width: 90%;
  .loader-wrapper {
    padding-bottom: 0;
    padding-top: 0;
  }
  .peg-bar {
    width: 100%;
    height: 0.75rem;
    border-radius: 5px;
    border: 1px solid #eee;
    position: relative;
    display: flex;
    align-items: center;
    .ticks {
      width: 100%;
      position: absolute;
      height: 0.25rem;
      display: flex;
      justify-content: space-between;
      top: 0;
      .tick:first-child,
      .tick:last-child {
        opacity: 0;
      }
      .tick {
        display: block;
        background: #eee;
        width: 1px;
        height: 0.65rem;
      }
    }
    .peg-progress {
      height: 100%;
      position: relative;
      transition: width 250ms ease;
      &.green { background: $primary; }
      &.yellow { background: $warning; }
      &.red { background: $danger; }
    }
    .negative-peg,
    .positive-peg {
      width: 50%;
      position: relative;
      height: 100%;
    }
    .negative-peg {
      display: flex;
      justify-content: flex-end;
      .peg-progress.full {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }
      .peg-indicator {
        position: absolute;
        left: 0;
        top: 0.75rem;
        p { margin-left: 0.5rem; }
        &::before {
          content: '';
          width: 0.4rem;
          height: 0.4rem;
          position: absolute;
          top: 0.4rem;
          left: -0.2rem;
          transform: rotate(45deg);
          border-left: 1px solid $grey-dark;
          border-top: 1px solid $grey-dark;
        }
      }
    }
    .positive-peg {
      display: flex;
      justify-content: flex-start;
      .peg-progress.full {
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      .peg-indicator {
        right: 0;
        position: absolute;
        top: 1rem;
        p { margin-right: 0.5rem; }
        &::after {
          content: '';
          width: 0.4rem;
          height: 0.4rem;
          position: absolute;
          top: 0.4rem;
          right: -0.2rem;
          transform: rotate(45deg);
          border-left: 1px solid $grey-dark;
          border-top: 1px solid $grey-dark;
        }
      }
    }
  }
}
</style>
