<template>
  <div class="deposit">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
              ref="inputRef"
              v-on:keyup.enter="shouldAllowDeposit && deposit()"
              type="number"
              min="0"
              v-model.number="depositAmount"
              class="input"
              placeholder="1.2345"
            />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold">
              XTZ
            </a>
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
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Wallet Holdings: </strong>
        <strong class="price-view">{{ numberWithCommas(walletBalanceXTZFormatted.toFixed(2)) }} XTZ</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Max Deposit: </strong>
        <strong class="price-view">
          <a @click="depositAmount = maxDepositAmt.toNumber()">{{ numberWithCommas(maxDepositAmt.toFixed(2)) }}</a> XTZ
        </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Collateral Value (USD): </strong>
        <strong class="price-view">${{ numberWithCommas(ovenDollarValue(ovenAddress).toFixed(2)) }}</strong>
      </p>
    </div>
    <div class="field is-horizontal">
      <div class="field-label"></div>
      <div class="field-body is-align-items-center">
        <div class="field">
          <p class="control">
            <progress
              class="progress"
              :class="collatoralizationWarningClasses(collateralizedRateAfterDeposit)"
              :value="collateralizedRateAfterDeposit.toFixed(2)"
              max="100"
            ></progress>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Current Collateral Utilization:</strong>
        <strong class="price-view">{{ currentCollateralRate(ovenAddress).toFixed(2) }}%</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong
          v-if="depositAmount"
          :class="collatoralizationWarningClasses(collateralizedRateAfterDeposit)"
          class="price-view"
        >{{ collateralizedRateAfterDeposit.toFixed(2) }}%</strong>
        <strong v-else class="price-view"> - </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>New Collateral Value (USD): </strong>
        <strong v-if="depositAmount" class="price-view">
          ${{ numberWithCommas(ovenDollarValuePlusDeposit(ovenAddress, new BigNumber(depositAmount)).toFixed(2)) }}
        </strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
          @click="deposit()"
          :disabled="!shouldAllowDeposit"
          class="button is-primary has-text-weight-bold"
          :class="{ 'is-loading': networkLoading }"
        >
          Deposit
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
  ovenBalanceFormatted,
  outstandingTokensFormatted,
  ovenDollarValue,
  ovenDollarValuePlusDeposit,
  currentCollateralRate,
  collatoralizationWarningClasses,
} = useOvenCalculations()

const depositAmount = ref<number | null>(null)
const networkLoading = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputRef.value?.focus()
})

const walletBalanceXTZFormatted = computed(() =>
  store.walletBalanceXTZ!.dividedBy(MUTEZ),
)

const maxDepositAmt = computed(() => walletBalanceXTZFormatted.value)

const shouldAllowDeposit = computed(() =>
  depositAmount.value !== null &&
  depositAmount.value > 0 &&
  new BigNumber(depositAmount.value).isLessThanOrEqualTo(walletBalanceXTZFormatted.value),
)

const collateralizedRateAfterDeposit = computed(() => {
  let amt = depositAmount.value
  if (!amt || amt <= 0) amt = 0

  const maxCollateral = ovenDollarValuePlusDeposit(props.ovenAddress, new BigNumber(amt)).dividedBy(store.collateralOperand!)
  const borrowed = outstandingTokensFormatted(props.ovenAddress)

  let collatRate = borrowed.dividedBy(maxCollateral)
  if (!collatRate.isFinite()) {
    collatRate = new BigNumber(0)
  }

  return collatRate.times(100)
})

const deposit = async () => {
  try {
    networkLoading.value = true

    const depositAmtMutez = new BigNumber(depositAmount.value!)
      .decimalPlaces(6)
      .multipliedBy(MUTEZ)
      .toFixed()

    const depositResult = await ovenClient(props.ovenAddress).deposit(depositAmtMutez)
    $eventBus.emit('oven-tx-submitted', { txResult: depositResult, ovenAddress: props.ovenAddress, verb: 'deposit' })
    emit('close-requested')
  } catch (e: any) {
    handleWalletError(e, 'Unable to deposit', 'There was an issue with the deposit request.')
  } finally {
    networkLoading.value = false
  }
}
</script>

<style lang="scss">
.deposit {
}
</style>
