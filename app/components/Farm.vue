<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn fast"
    leave-active-class="animate__animated animate__fadeOut fast"
  >
    <div class="box farm">
      <div v-if="farmContractData !== null">
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <Popover>
                <template #popup-content>
                  <p v-html="decimalsMap[pairName].description"></p>
                </template>
                <h1 class="title">
                  <a class="has-text-white">{{ pairName }} Farm <template v-if="inactiveFarms.includes(pairName)">(inactive)</template> </a>
                </h1>
              </Popover>

              <a
                target="_blank"
                rel="noopener"
                :href="bcdLink(contract)"
                class="contract-src"
              >
                <img src="~/assets/contract.svg" />
              </a>
            </div>
          </div>

          <div class="level-right"></div>
        </nav>

        <div v-if="store.walletPKH !== null" class="field is-grouped is-grouped-multiline">
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-info">{{ pairName }} Holdings</span>
              <span v-if="holdingsData" class="tag is-light">{{ holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2) }} {{ pairName }}</span>
              <span v-else class="tag is-light"><div class="loader"></div></span>
            </div>
          </div>
        </div>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Total Deposited</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(farmContractData.farmLpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
          </div>
        </nav>
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Pool Rate</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">0 kDAO / Week</p>
          </div>
        </nav>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Current Reward</p>
            </div>
          </div>

          <div v-if="!currentRewardPerWeek.isZero() && false" class="level-right">
            <span>
              <strong class="has-text-white">
                1 kDAO / Week Per
              </strong>
            </span>
            <Popover class="padded-left" extra-classes="small-price">
              <template #popup-content>
                <strong class="is-marginless">
                  {{ numberWithCommas(currentRatePerTokenPerWeek.toFixed(10)) }} {{ pairName }}
                </strong>
              </template>
              <a>
                <strong class="has-text-white is-underlined">{{ numberWithCommas(currentRatePerTokenPerWeek.toFixed(2)) }}</strong>
              </a>
            </Popover>

            <p class="has-text-white has-text-weight-bold padded-left">{{ pairName }}</p>
          </div>
          <div v-else class="level-right">
            <span>
              <strong class="has-text-white">
                0 kDAO / Week ({{ pairName }} farm is inactive)
              </strong>
            </span>
          </div>
        </nav>

        <div v-if="store.walletPKH !== null">
          <hr>

          <div v-if="depositedTokens !== null">
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Deposits</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ numberWithCommas(depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
                <p v-else class="has-text-white has-text-weight-bold">0.00 {{ pairName }}</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Pool %</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ currentPoolPercentage.times(100).toFixed(2) }}%</p>
                <p v-else class="has-text-white has-text-weight-bold">0%</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Reward Rate</p>
                </div>
              </div>

              <div class="level-right">
                <div class="is-flex" v-if="depositedTokens !== undefined && !depositedTokens.lpTokenBalance.isZero()">
                  <Popover extra-classes="small-price">
                    <template #popup-content>
                      <strong class="is-marginless">
                        {{ numberWithCommas(currentDripRate.toFixed(10)) }} kDAO / Week
                      </strong>
                    </template>
                    <a>
                      <strong class="has-text-white is-underlined">{{ numberWithCommas(currentDripRate.toFixed(2)) }}</strong>
                    </a>
                  </Popover>

                  <p class="has-text-white has-text-weight-bold padded-left">kDAO / Week</p>
                </div>
                <p v-else class="has-text-white has-text-weight-bold">0.00 kDAO / Week</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">
                    Claimable Rewards
                    <Popover extra-classes="small-price">
                      <template #popup-content>
                        <strong class="is-marginless">
                          Due to the way reward calculations are determined,<br>
                          your claimed amount might be included in a different <br>
                          block than was expected/displayed here, so you may <br>
                          receive a *slightly* different amount than this.
                        </strong>
                      </template>
                      <span>(<a>
                        <strong class="has-text-white is-underlined">est</strong>
                      </a>)</span>
                    </Popover>
                  </p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">
                  <Popover extra-classes="small-price">
                    <template #popup-content>
                      <strong class="is-marginless">
                        {{ numberWithCommas(estimatedRewards.dividedBy(decimalsMap.kDAO.mantissa).toFixed(10)) }} kDAO
                      </strong>
                    </template>
                    <a>
                      <strong class="has-text-white is-underlined">{{ numberWithCommas(estimatedRewards.dividedBy(decimalsMap.kDAO.mantissa).toFixed(2)) }}</strong>
                    </a>
                  </Popover>
                </p>
                <p class="has-text-white has-text-weight-bold padded-left">kDAO</p>
              </div>
            </nav>
            <br>

            <div v-if="!inactiveFarms.includes(pairName)" class="columns is-centered">
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="depositInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="depositInput = holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(36)"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="depositTokens"
                      :class="{ 'is-loading': networkSending || globalSending }"
                      :disabled="networkSending || globalSending || Math.sign(Number(depositInput)) < 1"
                      class="button is-info"
                    >
                      Deposit {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="withdrawInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="withdrawInput = depositedTokens ? depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toString() : '0'"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="withdrawTokens"
                      :class="{ 'is-loading': networkSending || globalSending }"
                      :disabled="withdrawShouldBeDisabled"
                      class="button is-info"
                    >
                      Withdraw {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="is-flex is-flex-direction-column has-text-centered" v-else>
              <hr class="mt-2">
              <p v-if="pairName !== 'kUSD/XTZ Quipuswap LP'" class="has-text-weight-bold">The {{ pairName }} farm has ended as part of <a class="has-text-white is-underlined" style="border-bottom: 1px solid white;" rel="noopener" target="_blank" href="https://governance.kolibri.finance/proposals/31">Kolibri Proposal #31</a>. Please remove your liquidity using the button below.</p>
              <p v-else>LP farms have moved to Quipuswap!</p>
              <div class="pt-4">
                <button
                  @click="withdrawLiquidity"
                  :class="{ 'is-loading': networkSending || globalSending }"
                  :disabled="networkSending || globalSending || depositedTokens === undefined || depositedTokens.lpTokenBalance.isZero()"
                  class="button is-info is-medium"
                >
                  Withdraw all {{ pairName }} liquidity
                </button>
              </div>
            </div>

            <div v-if="!inactiveFarms.includes(pairName)" class="buttons is-right">
              <button
                :disabled="networkSending || globalSending || estimatedRewards.isZero()"
                :class="{ 'is-loading': networkSending || globalSending }"
                @click="claim"
                class="button is-info"
              >
                Claim {{ numberWithCommas(estimatedRewards.dividedBy(decimalsMap.kDAO.mantissa).toFixed(2)) }} kDAO
              </button>
            </div>

          </div>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-white"></div>
          </div>
        </div>
      </div>
      <div v-else class="loader-wrapper">
        <div class="loader is-large is-white"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import BigNumber from 'bignumber.js'
import { Network } from '~/lib/kolibri'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { useLinks } from '~/composables/useLinks'

const props = defineProps<{
  pairName: string
  contract: string
  globalSending: boolean
}>()

const emit = defineEmits<{
  'new-estimated-rewards': [payload: { contract: string; estimatedRewards: BigNumber }]
  'initialized': [payload: { contractAddress: string; contract: any; claimable: BigNumber }]
}>()

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { numberWithCommas } = useFormatting()
const { bcdLink } = useLinks()

const inactiveFarms = ['kUSD', 'QLkUSD', 'kUSD/uUSD Flat Curve LP', 'kUSD/XTZ Quipuswap LP']

// Reactive state
const farmContractData = ref<any>(null)
const tokenContractData = ref<any>(null)
const holdingsData = ref<any>(null)
const depositedTokens = ref<any>(null)
const networkSending = ref(false)
const withdrawInput = ref<string | null>(null)
const depositInput = ref<string | null>(null)

const decimalsMap: Record<string, any> = {
  kDAO: {
    mantissa: new BigNumber(10).pow(18),
  },
  kUSD: {
    mantissa: new BigNumber(10).pow(18),
    balances: () => tokenContractData.value?.balances,
    description:
      "The kUSD farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://kolibri.finance/'>kUSD</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
  },
  'kUSD/uUSD Flat Curve LP': {
    mantissa: new BigNumber(10).pow(18),
    balances: () => tokenContractData.value?.tokens,
    description:
      "The kUSD/uUSD Flat Curve LP farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://app.youves.com/swap'>Youves kUSD/uUSD Flat Curve LP Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
  },
  'kUSD/XTZ Quipuswap LP': {
    mantissa: new BigNumber(10).pow(6),
    balances: () => tokenContractData.value?.storage?.ledger,
    description:
      "The kUSD/XTZ Quipuswap LP farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://analytics.quipuswap.com/pairs/KT1K4EwTpbvYN9agJdjpyJm4ZZdhpUNKB3F6'>Quipuswap kUSD/XTZ LP Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.<br><br><strong>Please note!</strong> Baking rewards are usually paid to the LP holder (see <a rel='noopener' target='_blank' href='https://madfish.crunch.help/quipu-swap/how-to-get-trading-fees-and-baking-rewards-on-quipu-swap'><b>this article</b></a>), but by depositing them in the farm the baking rewards for the XTZ portion of the pair go to the DAO instead.",
  },
  QLkUSD: {
    mantissa: new BigNumber(10).pow(36),
    balances: () => tokenContractData.value?.balances,
    description:
      "The QLkUSD farm allows you to deposit <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://kolibri.finance/liquidity-pool'>Kolibri Liquidity Pool Tokens</a> and farm <a class='has-text-weight-bold' target='_blank' rel='noopener' href='https://governance.kolibri.finance/'>Kolibri Governance Tokens (kDAO)</a>.",
  },
}

// Computed
const poolRatePerWeek = computed(() => {
  if (farmContractData.value === null) return new BigNumber(0)
  const minutesPerWeek = 10080
  const secondsPerWeek = minutesPerWeek * 60
  const blocksPerWeek =
    store.network === Network.Sandbox ? secondsPerWeek / 4 : minutesPerWeek * 2
  if (farmContractData.value.farmLpTokenBalance.isZero()) {
    return farmContractData.value.farmLpTokenBalance
  }
  return farmContractData.value.farm.plannedRewards.rewardPerBlock
    .times(blocksPerWeek)
    .dividedBy(decimalsMap.kDAO.mantissa)
})

const currentRatePerTokenPerWeek = computed(() =>
  new BigNumber(1).dividedBy(currentRewardPerWeek.value),
)

const currentRewardPerWeek = computed(() => {
  if (farmContractData.value === null) return new BigNumber(0)
  if (farmContractData.value.farmLpTokenBalance.isZero()) {
    return farmContractData.value.farmLpTokenBalance
  }
  return poolRatePerWeek.value.dividedBy(
    farmContractData.value.farmLpTokenBalance.dividedBy(decimalsMap[props.pairName].mantissa),
  )
})

const currentPoolPercentage = computed(() => {
  if (!depositedTokens.value || depositedTokens.value.lpTokenBalance.isZero()) {
    return new BigNumber(0)
  }
  return depositedTokens.value.lpTokenBalance.dividedBy(farmContractData.value.farmLpTokenBalance)
})

const currentDripRate = computed(() =>
  currentPoolPercentage.value.times(poolRatePerWeek.value),
)

const estimatedRewards = computed(() => {
  if (
    depositedTokens.value === undefined ||
    depositedTokens.value === null ||
    depositedTokens.value.lpTokenBalance.isZero()
  ) {
    return new BigNumber(0)
  }
  const accRewardPerShareStart = depositedTokens.value.accumulatedRewardPerShareStart

  const nextBlock = new BigNumber((store.currentBlockHeight ?? 0) + 1)
  const multiplier = nextBlock.minus(farmContractData.value.farm.lastBlockUpdate)
  const outstandingReward = multiplier.times(
    farmContractData.value.farm.plannedRewards.rewardPerBlock,
  )
  const claimedRewards = farmContractData.value.farm.claimedRewards.paid.plus(
    farmContractData.value.farm.claimedRewards.unpaid,
  )
  const totalRewards = outstandingReward.plus(claimedRewards)
  const plannedRewards =
    farmContractData.value.farm.plannedRewards.rewardPerBlock.times(
      farmContractData.value.farm.plannedRewards.totalBlocks,
    )
  const totalRewardsExhausted = totalRewards.isGreaterThan(plannedRewards)
  const reward = totalRewardsExhausted
    ? plannedRewards.minus(claimedRewards)
    : outstandingReward

  const lpMantissa = new BigNumber(10).pow(36)

  const rewardRatio = reward
    .times(lpMantissa)
    .div(farmContractData.value.farmLpTokenBalance)
  const accRewardPerShareEnd =
    farmContractData.value.farm.accumulatedRewardPerShare.plus(rewardRatio)

  const accumulatedRewardPerShare = BigNumber.max(
    accRewardPerShareEnd.minus(accRewardPerShareStart),
    new BigNumber(0),
  )

  const rewards = accumulatedRewardPerShare
    .times(depositedTokens.value.lpTokenBalance)
    .dividedBy(lpMantissa)

  emit('new-estimated-rewards', {
    contract: props.contract,
    estimatedRewards: rewards,
  })

  return rewards
})

const withdrawShouldBeDisabled = computed(() => {
  if (networkSending.value || props.globalSending) return true
  if (Math.sign(Number(withdrawInput.value)) < 1) return true
  if (!depositedTokens.value) return true
  return new BigNumber(withdrawInput.value!).isGreaterThan(
    depositedTokens.value.lpTokenBalance.dividedBy(decimalsMap[props.pairName].mantissa),
  )
})

// Methods
const initialize = async () => {
  console.log('Farm.initialize called!')
  const farmContract = await store.tezosToolkit.wallet.at(props.contract)
  farmContractData.value = await farmContract.storage()

  const tokenContract = await store.tezosToolkit.wallet.at(
    farmContractData.value.addresses.lpTokenContract,
  )
  tokenContractData.value = await tokenContract.storage()

  if (store.walletPKH !== null) {
    await updateTokenBalance()
  } else {
    $eventBus.on('wallet-connected', updateTokenBalance)
  }

  emit('initialized', {
    contractAddress: props.contract,
    contract: farmContract,
    claimable: estimatedRewards.value,
  })
}

const updateTokenBalance = async () => {
  const balanceMap = decimalsMap[props.pairName].balances()

  const rawHoldingsData = await balanceMap.get(store.walletPKH)

  if (rawHoldingsData === undefined) {
    holdingsData.value = { balance: new BigNumber(0) }
    // kUSD, QLkUSD and the Quipuswap LP return an object, where `balances` is set.
    // Youves does not return an object and only returns a balance.
    // TODO(keefertaylor): Generalize this code to make it less brittle.
  } else if (rawHoldingsData.balance !== undefined) {
    // Assign holdings data directly. This code path executes for kUSD, QLkUSD and the Quipuswap LP
    holdingsData.value = rawHoldingsData
  } else {
    // Assign holdingsData as an object. This code path executes for Youves LP
    holdingsData.value = { balance: rawHoldingsData }
  }
  depositedTokens.value = await farmContractData.value.delegators.get(store.walletPKH)
}

const claim = async () => {
  networkSending.value = true
  try {
    const farmContract = await store.tezosToolkit.wallet.at(props.contract)

    const sendResult = await farmContract.methodsObject.claim(null).send()

    $eventBus.emit('tx-submitted', sendResult)

    await sendResult.confirmation(1)

    holdingsData.value = null

    $eventBus.emit('refresh-kdao-holdings')
    await initialize()
  } catch (e) {
    console.error(e)
  } finally {
    networkSending.value = false
    $eventBus.emit('tx-finished')
  }
}

const withdrawLiquidity = async () => {
  networkSending.value = true
  try {
    const farmContract = await store.tezosToolkit.wallet.at(props.contract)

    const sendResult = await farmContract.methodsObject.escape().send()

    $eventBus.emit('tx-submitted', sendResult)

    await sendResult.confirmation(1)

    holdingsData.value = null
    await initialize()
  } catch (e) {
    console.error(e)
  } finally {
    networkSending.value = false
    $eventBus.emit('tx-finished')
  }
}

const depositTokens = async () => {
  networkSending.value = true
  try {
    const farmContract = await store.tezosToolkit.wallet.at(props.contract)
    const tokenContract = await store.tezosToolkit.wallet.at(
      farmContractData.value.addresses.lpTokenContract,
    )
    const sendAmt = new BigNumber(depositInput.value!).times(
      decimalsMap[props.pairName].mantissa,
    )

    const sendResult = await store.tezosToolkit.wallet
      .batch([])
      .withContractCall(tokenContract.methodsObject.approve(props.contract, sendAmt))
      .withContractCall(farmContract.methodsObject.deposit(sendAmt))
      .send()

    $eventBus.emit('tx-submitted', sendResult)

    await sendResult.confirmation(1)

    holdingsData.value = null
    await initialize()
  } catch (e) {
    console.error(e)
  } finally {
    networkSending.value = false
    $eventBus.emit('tx-finished')
    depositInput.value = null
  }
}

const withdrawTokens = async () => {
  networkSending.value = true
  try {
    const farmContract = await store.tezosToolkit.wallet.at(props.contract)
    const sendAmt = new BigNumber(withdrawInput.value!).times(
      decimalsMap[props.pairName].mantissa,
    )

    const sendResult = await farmContract.methodsObject.withdraw(sendAmt).send()

    $eventBus.emit('tx-submitted', sendResult)

    await sendResult.confirmation(1)

    holdingsData.value = null
    await initialize()
  } catch (e) {
    console.error(e)
  } finally {
    networkSending.value = false
    $eventBus.emit('tx-finished')
    withdrawInput.value = null
  }
}

const resetAndReinitialize = () => {
  console.log('Refreshing farms!')
  farmContractData.value = null
  tokenContractData.value = null
  holdingsData.value = null
  depositedTokens.value = null
  networkSending.value = false
  withdrawInput.value = null
  depositInput.value = null
  console.log('Done refreshing farms')
  nextTick(initialize)
}

// Lifecycle
onMounted(() => {
  nextTick(initialize)

  $eventBus.on('refresh-farms', resetAndReinitialize)
})

onUnmounted(() => {
  $eventBus.off('refresh-farms', resetAndReinitialize)
  $eventBus.off('wallet-connected', updateTokenBalance)
})
</script>

<style lang="scss">
.farm {
  .popper {
    max-width: 35rem;
  }
  .padded-left {
    margin-left: 0.25rem;
  }
  .contract-src {
    margin-left: 0.5rem;
    margin-bottom: 0.3rem;
    img {
      max-height: 2rem;
      &:hover {
        filter: contrast(0.8);
      }
    }
  }
  .control {
    &:hover {
      .max-button {
        opacity: 1;
      }
    }
    input:focus + .max-button {
      opacity: 1;
    }
  }
  .max-button {
    position: absolute;
    top: 0.75rem;
    color: $primary;
    right: 0.5rem;
    font-weight: bold;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    z-index: 9;
    opacity: 0;
    transition: opacity 250ms linear;
    &:hover {
      border-bottom: 1px solid $primary;
    }
  }
  strong.is-underlined {
    border-bottom: 1px solid white;
  }
  hr.bottomless {
    margin-bottom: 0;
  }
  .title {
    margin-bottom: 0.5rem;
  }
  .button.is-white {
    &:hover {
      color: $primary;
      &[disabled] {
        color: white;
      }
    }
    &:focus {
      border-color: $primary;
      color: $primary;
      &[disabled] {
        color: white;
        border-color: white;
      }
      &.is-loading::after {
        border-color: transparent transparent $primary $primary !important;
      }
    }
  }
  /* Chrome, Safari, Edge, Opera */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }
}
</style>
