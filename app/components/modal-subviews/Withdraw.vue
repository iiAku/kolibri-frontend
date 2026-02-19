<template>
  <div class="withdraw">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              ref="inputRef"
              v-on:keyup.enter="shouldAllowWithdraw && withdraw()"
              type="number"
              min="0"
              step="0.00000000000000001"
              v-model.number="withdrawAmount"
              class="input"
              placeholder="1.2345"
            />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold">XTZ</a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Oven Collateral: </strong>
        <strong class="price-view">
          <Popover extra-classes="small-price">
            <template #popup-content>
              <strong class="has-text-primary heading is-marginless">
                {{ numberWithCommas(ovenBalanceFormatted(ovenAddress).toFixed(6)) }} XTZ
              </strong>
            </template>

            <strong class="price-has-popover">
              {{ numberWithCommas(ovenBalanceFormatted(ovenAddress).toFixed(2)) }} XTZ
            </strong>
          </Popover>
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Max Withdraw Amount:</strong>
        <strong class="price-view">
          <a @click="withdrawAmount = maxWithdrawAmount.toNumber()">
            {{ numberWithCommas(maxWithdrawAmount.toFixed(2)) }} XTZ
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
                collatoralizationWarningClasses(collateralizedRateAfterWithdraw)
              "
              :value="collateralizedRateAfterWithdraw.toFixed(2)"
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
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong
          v-if="withdrawAmount"
          :class="
            collatoralizationWarningClasses(collateralizedRateAfterWithdraw)
          "
          class="price-view"
          >{{ collateralizedRateAfterWithdraw.toFixed(2) }}%</strong
        >
        <strong v-else class="price-view"> - </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
          @click="withdraw()"
          :disabled="!shouldAllowWithdraw"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Withdraw
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
import { MUTEZ } from '~/utils/constants'

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
  outstandingTokensFormatted,
  ovenBalance,
  ovenBalanceFormatted,
  currentPriceFormatted,
  ovenDollarValue,
  ovenDollarValueMinusWithdraw,
  currentCollateralRate,
  collatoralizationWarningClasses,
} = useOvenCalculations()

const withdrawAmount = ref<number | null>(null)
const networkLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const maxWithdrawAmount = computed(() => {
  const borrowed = outstandingTokensFormatted(props.ovenAddress) // kUSD
  const balance = ovenBalanceFormatted(props.ovenAddress) // XTZ

  if (borrowed.isZero()) {
    return balance.decimalPlaces(6)
  }

  const price = currentPriceFormatted() // USD per XTZ
  // (balance - maxWithdraw) * price >= borrowed * collateralOperand
  // maxWithdraw <= balance - (borrowed * collateralOperand / price)
  // Round required collateral UP so maxWithdraw stays within contract limits
  const requiredCollateralXTZ = borrowed.times(store.collateralOperand!).dividedBy(price).decimalPlaces(6, BigNumber.ROUND_UP)
  const maxWithdraw = balance.minus(requiredCollateralXTZ)

  return BigNumber.max(maxWithdraw, 0).decimalPlaces(6, BigNumber.ROUND_DOWN)
})

const shouldAllowWithdraw = computed(() => {
  if (!withdrawAmount.value || withdrawAmount.value <= 0) return false
  return new BigNumber(withdrawAmount.value).isLessThanOrEqualTo(maxWithdrawAmount.value)
})

const collateralizedRateAfterWithdraw = computed(() => {
  let amt = withdrawAmount.value
  if (!amt || amt <= 0) amt = 0

  if (ovenBalanceFormatted(props.ovenAddress).minus(amt).isNegative()) {
    return new BigNumber(0)
  }

  const maxCollateralDollars = ovenDollarValueMinusWithdraw(
    props.ovenAddress,
    new BigNumber(amt),
  ).dividedBy(store.collateralOperand!)

  const borrowed = outstandingTokensFormatted(props.ovenAddress)

  let collatRate = borrowed.dividedBy(maxCollateralDollars)
  if (!collatRate.isFinite()) {
    collatRate = new BigNumber(0)
  }

  return collatRate.times(100)
})

const isMaxWithdraw = computed(() => {
  if (!withdrawAmount.value || withdrawAmount.value <= 0) return false
  return new BigNumber(withdrawAmount.value).minus(maxWithdrawAmount.value).abs().isLessThan(1e-6)
})

const withdraw = async () => {
  try {
    networkLoading.value = true
    // When withdrawing max with no outstanding tokens, use exact raw balance
    const withdrawMutez = isMaxWithdraw.value && outstandingTokensFormatted(props.ovenAddress).isZero()
      ? ovenBalance(props.ovenAddress).toFixed()
      : new BigNumber(withdrawAmount.value!).decimalPlaces(6).multipliedBy(MUTEZ).toFixed()
    const withdrawResult = await ovenClient(props.ovenAddress).withdraw(withdrawMutez)
    $eventBus.emit('oven-tx-submitted', { txResult: withdrawResult, ovenAddress: props.ovenAddress, verb: 'withdraw' })
    emit('close-requested')
  } catch (e: any) {
    handleWalletError(e, 'Unable to withdraw', 'There was an issue with the withdraw request.')
  } finally {
    networkLoading.value = false
  }
}
</script>

<style lang="scss">
.withdraw {
}
</style>
