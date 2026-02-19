<template>
  <div class="repay">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              ref="inputRef"
              v-on:keyup.enter="shouldAllowRepay && repay()"
              type="number"
              min="0"
              v-model.number="repayAmount"
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
        <strong>Borrowed kUSD: </strong>
        <strong class="price-view">
          <Popover extra-classes="small-price">
            <template #popup-content>
              <strong class="has-text-primary heading is-marginless">
                {{ numberWithCommas(outstandingTokensFormatted(ovenAddress).toFixed(18)) }} kUSD
              </strong>
            </template>

            <strong class="price-has-popover">
              {{ numberWithCommas(outstandingTokensFormatted(ovenAddress).toFixed(2)) }} kUSD
            </strong>
          </Popover>
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Wallet Holdings: </strong>
        <strong class="price-view"
          >{{
            numberWithCommas(
              store.walletBalance!.dividedBy(Math.pow(10, 18)).toFixed(2)
            )
          }}
          kUSD</strong
        >
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Max Payback Amount: </strong>
        <strong class="price-view">
          <a @click="repayAmount = parseFloat(maxPaybackAmt.toFixed(18))">
            {{ numberWithCommas(maxPaybackAmt.toFixed(2)) }} kUSD
          </a>
        </strong>
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
                collatoralizationWarningClasses(collateralizedRateAfterRepaying)
              "
              :value="collateralizedRateAfterRepaying.toFixed(2)"
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
          v-if="isMaxRepay"
          class="price-view"
        >
          -
        </strong>
        <strong
          v-else-if="repayAmount && repayAmount > 0"
          :class="collatoralizationWarningClasses(collateralizedRateAfterRepaying)"
          class="price-view"
        >
          {{ collateralizedRateAfterRepaying.toFixed(2) }}%
        </strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Oven Liquidatable when XTZ price is:</strong>
        <strong
          v-if="isMaxRepay"
          class="price-view"
        >
          -
        </strong>
        <strong
          v-else-if="repayAmount && repayAmount > 0"
          class="price-view has-text-primary"
        >
          ${{ liquidationPriceAfterRepaying.toFixed(2) }}
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
          @click="repay()"
          :disabled="!shouldAllowRepay"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Repay
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
  outstandingTokens,
  outstandingTokensFormatted,
  ovenDollarValue,
  currentCollateralRate,
  collatoralizationWarningClasses,
  liquidatablePrice,
} = useOvenCalculations()

const repayAmount = ref<number | null>(null)
const networkLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const walletBalanceFormatted = computed(() =>
  store.walletBalance!.dividedBy(SHARD),
)

const isMaxRepay = computed(() => {
  if (!repayAmount.value || repayAmount.value <= 0) return false
  // parseFloat loses precision from BigNumber, so use a tolerance
  return new BigNumber(repayAmount.value).minus(maxPaybackAmt.value).abs().isLessThan(1e-12)
})

const shouldAllowRepay = computed(() => {
  if (!repayAmount.value || repayAmount.value <= 0) return false
  if (isMaxRepay.value) return true
  return new BigNumber(repayAmount.value).isLessThanOrEqualTo(
    outstandingTokensFormatted(props.ovenAddress),
  )
})

const maxPaybackAmt = computed(() => {
  const walletBal = walletBalanceFormatted.value
  const outstanding = outstandingTokensFormatted(props.ovenAddress)
  if (walletBal.isLessThanOrEqualTo(outstanding)) {
    return walletBal.decimalPlaces(18)
  }
  return outstanding.decimalPlaces(18)
})

const collateralizedRateAfterRepaying = computed(() => {
  let amt = repayAmount.value
  if (!amt || amt <= 0) amt = 0

  const maxCollateral = ovenDollarValue(props.ovenAddress).dividedBy(store.collateralOperand!)
  const borrowed = outstandingTokensFormatted(props.ovenAddress)

  let newTokenCount = borrowed.minus(amt)
  if (newTokenCount.isLessThan(0)) {
    newTokenCount = new BigNumber(0)
  }

  return newTokenCount.dividedBy(maxCollateral).times(100)
})

const liquidationPriceAfterRepaying = computed(() => {
  const rateDelta = 1 - collateralizedRateAfterRepaying.value.dividedBy(100).toNumber()
  const currentPrice = store.priceData!.price.dividedBy(MUTEZ)
  return currentPrice.minus(currentPrice.times(rateDelta))
})

const repay = async () => {
  try {
    networkLoading.value = true
    // When max repay, use exact raw outstanding tokens to avoid parseFloat precision overshoot
    const repayAmt = isMaxRepay.value
      ? outstandingTokens(props.ovenAddress)
      : new BigNumber(repayAmount.value!).decimalPlaces(18).multipliedBy(SHARD)
    const repayResult = await ovenClient(props.ovenAddress).repay(repayAmt.toFixed())
    $eventBus.emit('oven-tx-submitted', { txResult: repayResult, ovenAddress: props.ovenAddress, verb: 'repay' })
    emit('close-requested')
  } catch (e: any) {
    handleWalletError(e, 'Unable to repay', 'There was an issue with the repay request.')
  } finally {
    networkLoading.value = false
  }
}
</script>

<style lang="scss">
.repay {
}
</style>
