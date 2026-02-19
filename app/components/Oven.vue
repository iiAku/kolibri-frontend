<template>
  <div class="box oven">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1
              @mouseover="showTooltip = true"
              @mouseleave="showTooltip = false"
              class="title is-5 oven-name"
              v-if="!editingName"
            >
              <a
                target="_blank"
                rel="noopener"
                :href="tzktLinkContract(ovenAddress)"
              >
                {{ ovenName }}
              </a>
              <span v-if="showTooltip" class="edit-button animate__fadeIn animate__animated">
                <a
                  @mouseover="toggleIcon = true"
                  @mouseleave="toggleIcon = false"
                  @click="editingName = true"
                >
                  <img v-if="toggleIcon" src="~/assets/icon-edit-green.svg" />
                  <img v-else src="~/assets/icon-edit-grey.svg" />
                </a>
              </span>
            </h1>
            <div v-else class="field is-grouped oven-name-edit">
              <p class="control is-expanded">
                <input
                  ref="nameInput"
                  class="input"
                  type="text"
                  placeholder="Your Awesome Oven"
                  v-model="editInput"
                />
              </p>
              <div class="control">
                <div class="buttons">
                  <button @click="saveOvenName" class="button is-primary">
                    <span v-if="editInput">Save</span>
                    <span v-else>Clear</span>
                  </button>
                  <a @click="editingName = false" class="button">Cancel</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right side -->
        <div class="level-right">
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.balance) !== 0)
              "
              @click="emit('modal-open-requested', 'Borrow', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Borrow kUSD
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.outstandingTokens) !== 0)
              "
              @click="emit('modal-open-requested', 'Repay', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Pay Back kUSD
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated ||
                pendingTransaction ||
                updatingData ||
                !(ovenData && parseInt(ovenData.balance) !== 0)
              "
              @click="emit('modal-open-requested', 'Withdraw', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Withdraw XTZ
            </button>
          </p>
          <p class="level-item">
            <button
              :disabled="
                isLiquidated || pendingTransaction || updatingData || !ovenData
              "
              @click="emit('modal-open-requested', 'Deposit', ovenAddress)"
              class="button is-small is-primary has-text-weight-bold"
            >
              Deposit XTZ
            </button>
          </p>
        </div>
      </nav>
    </div>

    <div v-if="pendingTransaction" class="loader-wrapper">
      <h1 class="title is-marginless is-5">
        <a
          :title="String(pendingTransaction)"
          v-if="pendingTransaction !== true"
          target="_blank"
          rel="noopener"
          :href="tzktLinkTx(String(pendingTransaction))"
        >Transaction Pending...</a>
        <span v-else>Transaction Pending...</span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else-if="ovenData !== null && !updatingData" class="oven-info">
      <div v-if="isLiquidated" class="liquidated-warning">
        <h1 class="title is-4 has-text-white">
          This Oven Has Been
          <NuxtLink
            rel="noopener"
            target="_blank"
            to="/docs/liquidation/overview"
          >Liquidated</NuxtLink>
        </h1>
      </div>
      <div class="columns is-gapless">
        <div
          class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center"
        >
          <div
            class="is-flex is-flex-direction-column is-justify-content-center left-info"
          >
            <p class="heading">
              Delegated Baker:
              <strong v-if="ovenData.baker">
                <a
                  class="address"
                  @click="emit('show-delegate-modal', ovenAddress)"
                >
                  {{ ovenData.baker }}
                </a>
              </strong>

              <Popover v-else>
                <template #popup-title>
                  <strong class="has-text-danger">Warning</strong>
                </template>

                <template #popup-content>
                  <strong>
                    This oven is currently <i>not</i> delegated to any baker,
                    and is not
                    <br />
                    receiving staking rewards. Please
                    <a @click="emit('show-delegate-modal', ovenAddress)">click here</a>
                    to delegate to a baker.
                  </strong>
                </template>

                <strong class="has-text-danger">
                  <a @click="emit('show-delegate-modal', ovenAddress)">Set a baker</a>
                </strong>
              </Popover>
            </p>
            <p class="heading">
              Collateral Utilization:
              <strong v-if="collatoralizedRate < 80">{{ collatoralizedRate }}%</strong>
              <strong
                v-else-if="collatoralizedRate < 100"
                class="has-text-warning"
              >{{ collatoralizedRate }}%</strong>
              <strong v-else class="has-text-danger">{{ collatoralizedRate }}%</strong>

              <span v-if="!outstandingTokens(ovenAddress).isZero()">
                | Liquidatable when XTZ =

                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong class="has-text-primary heading is-marginless">
                      ${{ liquidatablePrice(ovenAddress).toFixed(6) }}
                    </strong>
                  </template>
                  <strong class="price-has-popover">${{ liquidatablePrice(ovenAddress).toFixed(2) }}</strong>
                </Popover>
              </span>
            </p>

            <div class="allocation-info is-fullwidth">
              <progress
                v-if="collatoralizedRate < 80"
                class="progress is-primary"
                :value="collatoralizedRate"
                max="100"
              >
                {{ collatoralizedRate }}%
              </progress>
              <progress
                v-else-if="collatoralizedRate < 100"
                class="progress is-warning"
                :value="collatoralizedRate"
                max="100"
              >
                {{ collatoralizedRate }}%
              </progress>
              <progress
                v-else
                class="progress is-danger"
                :value="collatoralizedRate"
                max="100"
              >
                {{ collatoralizedRate }}%
              </progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info is-mobile">
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Collateral Value</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong class="has-text-primary heading is-marginless">
                      ${{ numberWithCommas(ovenValue(ovenData.balance)) }} USD
                    </strong>
                  </template>
                  <strong class="price-has-popover">
                    ${{ numberWithCommas(ovenValue(ovenData.balance).toFixed(2)) }} USD
                  </strong>
                </Popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong class="has-text-primary heading is-marginless">
                      {{ numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6)).toFixed(6)) }} XTZ
                    </strong>
                  </template>
                  <strong class="price-has-popover">
                    {{ numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6)).toFixed(2)) }} XTZ
                  </strong>
                </Popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Loan Amt</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong class="has-text-primary heading is-marginless">
                      {{ numberWithCommas(ovenData.outstandingTokens.dividedBy(Math.pow(10, 18)).toFixed(12)) }}
                      kUSD
                    </strong>
                  </template>
                  <strong class="price-has-popover">
                    {{ numberWithCommas(ovenData.outstandingTokens.dividedBy(Math.pow(10, 18)).toFixed(2)) }}
                    kUSD
                  </strong>
                </Popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Stability Fee</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong class="has-text-primary heading is-marginless">
                      {{ numberWithCommas(ovenData.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(12)) }}
                      kUSD
                    </strong>
                  </template>
                  <strong class="price-has-popover">
                    {{ numberWithCommas(ovenData.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)) }}
                    kUSD
                  </strong>
                </Popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
    <div v-else class="loader-wrapper">
      <h1 class="title is-marginless is-5">Loading Oven Data...</h1>
      <div class="loader left-spaced"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import BigNumber from 'bignumber.js'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { useLinks } from '~/composables/useLinks'
import { useOvenCalculations } from '~/composables/useOvenCalculations'
import { useTransactions } from '~/composables/useTransactions'
import { useWallet } from '~/composables/useWallet'
import { MUTEZ, SHARD } from '~/utils/constants'

const props = defineProps<{
  ovenAddress: string
}>()

const emit = defineEmits<{
  'modal-open-requested': [page: string, ovenAddress: string]
  'show-delegate-modal': [ovenAddress: string]
}>()

const store = useKolibriStore()
const { numberWithCommas, truncateChars } = useFormatting()
const { tzktLinkContract, tzktLinkTx } = useLinks()
const { collatoralizedRateForOven, outstandingTokens, liquidatablePrice } = useOvenCalculations()
const { handleWalletError } = useTransactions()
const { ovenClient, calculateSandboxStabFeeTime } = useWallet()
const { $eventBus } = useNuxtApp()

const pendingTransaction = ref<string | boolean>(false)
const updatingData = ref(false)
const showTooltip = ref(false)
const editingName = ref(false)
const toggleIcon = ref(false)
const editInput = ref(store.ovenNames[props.ovenAddress] ?? '')
const nameInput = ref<HTMLInputElement | null>(null)

let interval: ReturnType<typeof setInterval> | null = null

const ovenData = computed(() => store.ownedOvens?.[props.ovenAddress] ?? null)

const isLiquidated = computed(() => ovenData.value?.isLiquidated ?? false)

const collatoralizedRate = computed(() => {
  if (!ovenData.value) return 0
  return collatoralizedRateForOven(ovenData.value)
})

const ovenName = computed(() => {
  const name = store.ovenNames[props.ovenAddress]
  if (name) {
    return name + ` (${truncateChars(props.ovenAddress, 18)})`
  }
  return props.ovenAddress
})

const ovenValue = (ovenBalance: BigNumber): BigNumber => {
  const currentValue = store.priceData!.price
    .multipliedBy(ovenBalance)
    .dividedBy(new BigNumber(10).pow(10))
  return currentValue.dividedBy(new BigNumber(10).pow(2))
}

const saveOvenName = () => {
  store.ovenNames[props.ovenAddress] = editInput.value
  window.localStorage.setItem('oven-names', JSON.stringify(store.ovenNames))
  editingName.value = false
}

const updateOvenData = async () => {
  const keys = [
    'baker',
    'balance',
    'borrowedTokens',
    'stabilityFee',
    'isLiquidated',
  ] as const

  let stabFeeDate: Date
  if (store.isSandbox) {
    stabFeeDate = calculateSandboxStabFeeTime()
  } else {
    stabFeeDate = new Date()
  }

  const client = ovenClient(props.ovenAddress)
  const values = await Promise.all([
    client.getBaker(),
    client.getBalance(),
    client.getBorrowedTokens(),
    client.getStabilityFees(stabFeeDate),
    client.isLiquidated(),
  ])

  const baker = values[0]
  const balance = values[1]
  const borrowedTokens = values[2]
  const stabilityFee = values[3]
  const isLiquidatedVal = values[4]

  // After a full repay, unrepayable dust (1-2 shard units) can remain on-chain
  // due to rounding differences between client and contract math.
  // If both borrowed and fee are below display precision, treat as zero.
  const rawOutstanding = borrowedTokens.plus(stabilityFee)
  const outstandingTokensVal = rawOutstanding.dividedBy(SHARD).toFixed(2) === '0.00'
    ? new BigNumber(0)
    : rawOutstanding

  if (!store.ownedOvens) return

  store.ownedOvens[props.ovenAddress] = {
    baker,
    balance,
    borrowedTokens,
    stabilityFee,
    outstandingTokens: outstandingTokensVal,
    isLiquidated: isLiquidatedVal,
    ovenAddress: props.ovenAddress,
    ovenOwner: store.walletPKH ?? '',
  }
}

const waitForTxAndRefresh = async (txResult: any, verb: string) => {
  let confirmed = false
  try {
    pendingTransaction.value = txResult.opHash
    console.log(`[Oven] ${verb} tx submitted: ${txResult.opHash}, waiting for confirmation...`)

    // Taquito v24 confirmation() can hang if the block subscription stalls.
    // Race against a timeout so the UI always recovers.
    const timeout = new Promise(resolve => setTimeout(resolve, 60_000))
    const result = await Promise.race([
      txResult.confirmation(1).then(() => 'confirmed' as const),
      timeout.then(() => 'timeout' as const),
    ])
    confirmed = result === 'confirmed'
    console.log(`[Oven] ${verb} ${confirmed ? 'confirmed' : 'timed out'}, refreshing data...`)
  } catch (err: any) {
    console.error(`[Oven] ${verb} confirmation error:`, err)
  } finally {
    // If confirmation didn't resolve, wait a block cycle for the RPC to catch up
    if (!confirmed) {
      await new Promise(resolve => setTimeout(resolve, 15_000))
    }

    try {
      updatingData.value = true
      pendingTransaction.value = false
      await updateOvenData()
      store.walletBalance = await store.tokenClient.getBalance(store.walletPKH!)
      store.walletBalanceXTZ = await store.tezosToolkit.tz.getBalance(store.walletPKH!)
    } catch (refreshErr: any) {
      console.error(`[Oven] ${verb} data refresh error:`, refreshErr)
    } finally {
      updatingData.value = false
      pendingTransaction.value = false
    }
  }
}

// Focus input when editing name
watch(editingName, async (val) => {
  if (val) {
    await nextTick()
    nameInput.value?.focus()
  }
})

// Event bus listener
const onOvenTxSubmitted = (event: { txResult: any; ovenAddress: string; verb: string }) => {
  if (props.ovenAddress === event.ovenAddress) {
    waitForTxAndRefresh(event.txResult, event.verb)
  }
}

onMounted(async () => {
  await updateOvenData()

  interval = setInterval(async () => {
    await updateOvenData()
  }, 60 * 1000)

  $eventBus.on('oven-tx-submitted', onOvenTxSubmitted)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  $eventBus.off('oven-tx-submitted', onOvenTxSubmitted)
})
</script>

<style lang="scss">
.oven {
  padding: 0;
  width: 100%;
  .oven-name-edit {
    max-height: 1rem;
    margin-top: -1.5rem;
    .input {
      width: 18rem;
    }
  }
  .oven-name {
    cursor: pointer;
    .edit-button {
      img {
        max-width: 1rem;
        margin: 0.2rem;
        transition: transform 500ms ease;
        &:hover {
          transform: scale(1.125);
        }
      }
    }
  }
  .address {
    text-transform: initial;
  }
  .oven-info {
    position: relative;
    & > .buttons {
      margin-bottom: 2rem;
    }
    .columns {
      @include until($widescreen) {
        flex-direction: column;
      }
    }
    .liquidated-warning {
      display: flex;
      position: absolute;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
      background: #000000cf;
      color: white;
      a:hover {
        color: lighten($primary, 20%);
      }
    }
  }
  .loader-wrapper {
    padding: 1.75rem;
  }
  .popper.small-price {
    padding: 0.5rem;
    font-weight: bold;
  }
  .price-has-popover {
    cursor: pointer;
    border-bottom: 1px solid $primary;
  }
  .pending-tx {
    .heading {
      margin-right: 0.5rem;
      margin-bottom: 0;
    }
  }
  .top {
    padding: 1rem;
    border-bottom: 2px solid $light-grey;

    .popper {
      padding: 0.5rem;
    }
    .level {
      @include until($widescreen) {
        flex-direction: column;
        .level-left {
          margin-bottom: 0.75rem;
        }
      }
    }
  }
  .right-info {
    margin: 1rem 0;
    @include until($desktop) {
      padding-bottom: 1rem;
    }
    &.compact {
      margin-top: 0;
    }
  }
  .left-info {
    width: 100%;
    padding: 0.75rem 1.5rem;
    progress {
      height: 0.75rem;
    }
  }
  .tx-hash {
    font-size: 0.5rem;
  }
}
</style>
