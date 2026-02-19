<template>
  <div class="box oven public-oven">
    <div class="top">
      <nav class="level is-mobile">
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5 is-family-monospace">
              <a
                target="_blank"
                rel="noopener"
                :href="tzktLinkContract(oven.ovenAddress)"
              >
                {{ oven.ovenAddress }}
              </a>
            </h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item liquidation-buttons">
            <slot v-if="store.walletPKH !== null" name="liquidation-button">
              <template v-if="store.privateLiquidationThreshold">
                <Popover v-if="privateLiquidationThreshold.isGreaterThan(collatoralizedRateForOven(oven))">
                  <template #popup-content>
                    <strong
                      class="has-text-primary is-marginless has-text-centered"
                    >
                      You can only liquidate ovens as an individual that are &lt;{{ store.collateralRate!.minus(store.privateLiquidationThreshold!).dividedBy(1e18) }}% collateralized ({{ privateLiquidationThreshold }}%+ utilization).<br>You can read more about this change <a style="border-bottom: 1px solid #3EBD93;" target="_blank" rel="noopener" href="https://discuss.kolibri.finance/t/kip-006-prioritize-the-liquidation-pool-in-liquidations/58">here</a>
                    </strong>
                  </template>

                  <!-- Note, using v-if in a default scoped slot breaks the underlying popper library :-/ -->
                  <span>
                    <a
                      :disabled="pendingTransaction || (store.privateLiquidationThreshold && privateLiquidationThreshold.isGreaterThan(collatoralizedRateForOven(oven)))"
                      v-if="
                        store.wallet !== null &&
                        !oven.isLiquidated &&
                        lpLiquidationThreshold.isLessThan(collatoralizedRateForOven(oven))"
                      :class="{'is-loading': networkLoading}"
                      class="button is-danger is-small">
                      Liquidate
                    </a>
                  </span>
                </Popover>

                <button
                  v-else
                  :disabled="!!pendingTransaction"
                  :class="{'is-loading': networkLoading}"
                  @click="liquidateOven()"
                  class="button is-danger is-small">
                  Liquidate
                </button>
              </template>
              <template v-else>
                <button
                  :disabled="!!pendingTransaction"
                  v-if="store.wallet !== null && !oven.isLiquidated && Number(collatoralizedRateForOven(oven)) > 100"
                  @click="liquidateOven()"
                  :class="{'is-loading': networkLoading}"
                  class="button is-danger is-small">
                  Liquidate
                </button>
              </template>

              <NuxtLink
                to="/liquidity-pool"
                v-if="
                  store.wallet !== null &&
                  !store.lpDisabled &&
                  !oven.isLiquidated &&
                  store.collateralRate!
                    .dividedBy(1e18)
                    .dividedBy(store.collateralOperand!)
                    .isLessThan(collatoralizedRateForOven(oven))
                "
                class="button is-danger is-small">
                Liquidate via Liquidity Pool
              </NuxtLink>
            </slot>
          </div>
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
        >
          Transaction Pending...
        </a>
        <span v-else>
          Transaction Pending...
        </span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else class="oven-info">
      <div v-if="oven.isLiquidated" class="liquidated-warning">
        <h1 class="title is-4 has-text-white">
          This Oven Has Been
          <NuxtLink
            rel="noopener"
            target="_blank"
            to="/docs"
          >Liquidated</NuxtLink>
        </h1>
      </div>
      <div :class="{'is-flex-direction-column': compact}" class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://${store.network === 'mainnet' ? '' : store.network + '.'}tzkt.io/${oven.baker}/delegators`">{{ oven.baker }}</a></strong></p>
            <div class="is-flex is-justify-content-space-between">
              <p class="heading delegated-baker">Owned By:
                <a
                    target="_blank"
                    rel="noopener"
                    class="has-text-weight-semibold"
                    :href="tzktLinkContract(oven.ovenOwner)"
                >
                  {{ oven.ovenOwner }}
                </a>
              </p>
              <p class="heading">Utilization:
                <strong v-if="Number(collatoralizedRateForOven(oven)) < 80">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else-if="Number(collatoralizedRateForOven(oven)) < 100" class="has-text-warning">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else class="has-text-danger">{{ collatoralizedRateForOven(oven) }}%</strong>
              </p>
            </div>

            <div class="allocation-info is-fullwidth">
              <progress v-if="Number(collatoralizedRateForOven(oven)) < 80" class="progress is-primary" :value="Number(collatoralizedRateForOven(oven))" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else-if="Number(collatoralizedRateForOven(oven)) < 100" class="progress is-warning" :value="Number(collatoralizedRateForOven(oven))" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else class="progress is-danger" :value="Number(collatoralizedRateForOven(oven))" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav :class="{compact}" class="level right-info">
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Collateral Value</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong
                      class="has-text-primary heading is-marginless"
                    >
                      ${{ numberWithCommas(ovenValue(oven.balance)) }} USD
                    </strong>
                  </template>

                  <strong class="price-has-popover">${{
                      numberWithCommas(ovenValue(oven.balance).toFixed(2))
                    }} USD
                  </strong>
                </Popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Balance</p>
                <p class="title is-6">
                  <Popover extra-classes="small-price">
                    <template #popup-content>
                      <strong
                        class="has-text-primary heading is-marginless"
                      >
                        {{
                          numberWithCommas(
                            oven.balance.dividedBy(Math.pow(10, 6))
                          )
                        }}
                        ꜩ
                      </strong>
                    </template>

                    <strong class="price-has-popover">{{
                        numberWithCommas(
                          oven.balance.dividedBy(Math.pow(10, 6)).toFixed(2)
                        )
                      }} ꜩ
                    </strong>
                  </Popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">
                  Loan Amt
                </p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong
                      class="has-text-primary heading is-marginless"
                    >
                      {{
                        numberWithCommas(
                          oven.outstandingTokens.dividedBy(Math.pow(10, 18))
                        )
                      }}
                      kUSD
                    </strong>
                  </template>

                  <strong class="price-has-popover">{{
                      numberWithCommas(
                        oven.outstandingTokens
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(2)
                      )
                    }} kUSD
                  </strong>
                </Popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Stability Fee</p>
                <Popover extra-classes="small-price">
                  <template #popup-content>
                    <strong
                      class="has-text-primary heading is-marginless"
                    >
                      {{
                        numberWithCommas(
                          oven.stabilityFee.dividedBy(Math.pow(10, 18))
                        )
                      }}
                      kUSD
                    </strong>
                  </template>

                  <strong class="price-has-popover">{{
                      numberWithCommas(
                        oven.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)
                      )
                    }} kUSD
                  </strong>
                </Popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BigNumber from 'bignumber.js'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { useLinks } from '~/composables/useLinks'
import { useOvenCalculations } from '~/composables/useOvenCalculations'
import { useTransactions } from '~/composables/useTransactions'
import { useWallet } from '~/composables/useWallet'
import { SHARD } from '~/utils/constants'
import type { OvenData } from '~/types'

const props = defineProps<{
  oven: OvenData
  compact?: boolean
  liquidateEmitOnly?: boolean
}>()

const emit = defineEmits<{
  'oven-liquidated': [ovenAddress: string]
}>()

const store = useKolibriStore()
const { numberWithCommas } = useFormatting()
const { tzktLinkContract, tzktLinkTx } = useLinks()
const { collatoralizedRateForOven } = useOvenCalculations()
const { handleWalletError } = useTransactions()
const { ovenClient } = useWallet()

const pendingTransaction = ref<string | boolean | null>(null)
const networkLoading = ref(false)

const privateLiquidationThreshold = computed(() =>
  store.collateralRate!
    .plus(store.privateLiquidationThreshold!)
    .dividedBy(SHARD)
    .dividedBy(store.collateralOperand!),
)

const lpLiquidationThreshold = computed(() =>
  store.collateralRate!
    .dividedBy(SHARD)
    .dividedBy(store.collateralOperand!),
)

const ovenValue = (ovenBalance: BigNumber): BigNumber => {
  const currentValue = store.priceData!.price
    .multipliedBy(ovenBalance)
    .dividedBy(new BigNumber(10).pow(10))
  return currentValue.dividedBy(new BigNumber(10).pow(2))
}

const liquidateOven = async () => {
  networkLoading.value = true
  try {
    const tx = await ovenClient(props.oven.ovenAddress).liquidate()

    networkLoading.value = false

    pendingTransaction.value = tx.opHash

    await tx.confirmation(1)

    pendingTransaction.value = null

    emit('oven-liquidated', props.oven.ovenAddress)
  } catch (e) {
    networkLoading.value = false
    handleWalletError(e, "Couldn't liquidate oven", 'There was an issue liquidating this oven!')
  }
}
</script>

<style lang="scss">
.public-oven {
  @include until($desktop) {
    .level-item {
      white-space: nowrap;
      .title {
        text-overflow: ellipsis;
        max-width: 90vw;
        overflow: hidden;
      }
    }
  }
  .liquidation-buttons{
    button:not(first-child){
      margin-left: .5rem;
    }
  }
  .delegated-baker{
    max-width: 60vw;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}
</style>
