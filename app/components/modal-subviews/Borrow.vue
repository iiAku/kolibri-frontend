<template>
  <div class="borrow">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              ref="inputRef"
              v-on:keyup.enter="shouldAllowBorrow && borrow()"
              type="number"
              min="0"
              v-model.number="borrowAmount"
              class="input"
              placeholder="1.2345"
            />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold"> kUSD </a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Borrowed kUSD:</strong>
        <strong class="price-view"
          >{{
            numberWithCommas(borrowedTokensFormatted(ovenAddress).toFixed(2))
          }}
          kUSD</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Max Borrow Amount:</strong>
        <strong class="price-view">
          {{ numberWithCommas(maxBorrowAmtkUSD(ovenAddress).toFixed(2)) }} kUSD
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <a
          v-if="borrowAmtNumber.isLessThanOrEqualTo(maxSafeAmt.times(1.01))"
          @click="borrowAmount = parseFloat(maxSafeAmt.toFixed(2))"
          class="has-text-weight-bold"
          >Max Safe (80%)</a
        >
        <span class="has-text-weight-bold" v-else
          >You are >80% collateralized, which is not recommended!</span
        >
      </p>
    </div>
    <div class="field is-horizontal">
      <div class="field-label"></div>
      <div class="field-body is-align-items-center">
        <div class="field">
          <p class="control">
            <progress
              class="progress"
              :class="
                collatoralizationWarningClasses(
                  collateralizedRateAfterBorrowing
                )
              "
              :value="collateralizedRateAfterBorrowing.toFixed(2)"
              max="100"
            ></progress>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Current Collateral Utilization:</strong>
        <strong class="price-view"
          >{{ currentCollateralRate(ovenAddress).toFixed(2) }}%</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong
          v-if="borrowAmount && borrowAmount > 0"
          :class="
            collatoralizationWarningClasses(collateralizedRateAfterBorrowing)
          "
          class="price-view"
          >{{ collateralizedRateAfterBorrowing.toFixed(2) }}%</strong
        >
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Oven Liquidatable when XTZ price is:</strong>
        <strong
          v-if="borrowAmount && borrowAmount > 0"
          class="price-view has-text-danger"
        >
          ${{ liquidationPriceAfterBorrowing.toFixed(2) }}
        </strong>
        <strong
          v-else-if="borrowedTokens(ovenAddress).isGreaterThan(0)"
          class="price-view"
        >
          ${{ liquidatablePrice(ovenAddress).toFixed(2) }}
        </strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
          @click="borrow()"
          :disabled="!shouldAllowBorrow"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Borrow
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BigNumber from 'bignumber.js'
import { useKolibriStore } from '~/stores/kolibri'
import { useOvenCalculations } from '~/composables/useOvenCalculations'
import { useFormatting } from '~/composables/useFormatting'
import { useTransactions } from '~/composables/useTransactions'
import { useWallet } from '~/composables/useWallet'
import { SHARD, MUTEZ } from '~/utils/constants'

const props = defineProps<{ ovenAddress: string }>()
const emit = defineEmits<{
  'close-requested': []
}>()

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { numberWithCommas } = useFormatting()
const { handleWalletError } = useTransactions()
const { ovenClient } = useWallet()
const {
  borrowedTokens,
  borrowedTokensFormatted,
  outstandingTokensFormatted,
  ovenDollarValue,
  maxBorrowAmtkUSD,
  currentCollateralRate,
  collatoralizationWarningClasses,
  liquidatablePrice,
} = useOvenCalculations()

const borrowAmount = ref<number | null>(null)
const networkLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const maxSafeAmt = computed(() =>
  ovenDollarValue(props.ovenAddress)
    .dividedBy(store.collateralOperand!)
    .multipliedBy(0.8)
    .minus(outstandingTokensFormatted(props.ovenAddress))
    .decimalPlaces(18),
)

const shouldAllowBorrow = computed(() => {
  if (!borrowAmount.value || borrowAmount.value <= 0) return false
  return (
    borrowAmount.value <=
    maxBorrowAmtkUSD(props.ovenAddress).decimalPlaces(18).toNumber()
  )
})

const borrowAmtNumber = computed(() =>
  borrowAmount.value ? new BigNumber(borrowAmount.value) : new BigNumber(0),
)

const collateralizedRateAfterBorrowing = computed(() => {
  let amt = borrowAmount.value
  if (!amt || amt <= 0) amt = 0

  const maxCollateral = ovenDollarValue(props.ovenAddress).dividedBy(store.collateralOperand!)
  const borrowed = outstandingTokensFormatted(props.ovenAddress)

  return borrowed.plus(amt).dividedBy(maxCollateral).times(100)
})

const liquidationPriceAfterBorrowing = computed(() => {
  const rateDelta = 1 - collateralizedRateAfterBorrowing.value.dividedBy(100).toNumber()
  const currentPrice = store.priceData!.price.dividedBy(MUTEZ)
  return currentPrice.minus(currentPrice.times(rateDelta))
})

const borrow = async () => {
  try {
    networkLoading.value = true
    const borrowAmt = new BigNumber(borrowAmount.value!)
      .decimalPlaces(18)
      .multipliedBy(SHARD)
    const borrowResult = await ovenClient(props.ovenAddress).borrow(borrowAmt.toFixed())
    $eventBus.emit('oven-tx-submitted', { txResult: borrowResult, ovenAddress: props.ovenAddress, verb: 'borrow' })
    emit('close-requested')
  } catch (e: any) {
    handleWalletError(e, 'Unable to borrow', 'There was an issue with the borrow request.')
  } finally {
    networkLoading.value = false
  }
}
</script>

<style lang="scss">
.borrow {
}
</style>
