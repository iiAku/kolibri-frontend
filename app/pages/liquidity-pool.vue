<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { MUTEZ, SHARD } from '~/utils/constants'
import type { OvenData } from '~/types'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { numberWithCommas, formatNumber } = useFormatting()
const { handleWalletError } = useTransactions()

const warningModalOpen = ref(false)
const depositInput = ref<string | number>('')
const redeemInput = ref<string | number>('')
const poolBalance = ref<BigNumber | null>(null)
const txPending = ref(false)

const walletBalanceFormatted = computed(() =>
  store.walletBalance?.dividedBy(SHARD),
)

const liquidatableOvens = computed(() => {
  if (store.allOvensData === null || store.priceData === null) return null

  return store.allOvensData.filter((oven: OvenData) => {
    const currentHoldings = oven.balance.dividedBy(MUTEZ)
    const currentPrice = store.priceData!.price.dividedBy(MUTEZ)
    const maxCollateral = currentPrice.multipliedBy(currentHoldings).dividedBy(2)
    const borrowedTokens = oven.outstandingTokens.dividedBy(SHARD)

    if (maxCollateral.isZero()) return false

    return borrowedTokens.dividedBy(maxCollateral).isGreaterThanOrEqualTo(1)
  })
})

const updatePoolBalance = async () => {
  const kUSDContract = await store.tezosToolkit.wallet.at(store.lpTokenAddress!)
  const kUSDStorage = await kUSDContract.storage() as any
  const balance = await kUSDStorage.balances.get(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
  if (balance === undefined) {
    poolBalance.value = new BigNumber(0)
  } else {
    poolBalance.value = balance.balance
  }
}

const liquidateOven = async (oven: OvenData) => {
  txPending.value = true
  try {
    const lpContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
    const sendResult = await lpContract.methodsObject.liquidate(oven.ovenAddress).send()
    await sendResult.confirmation(1)

    poolBalance.value = null
    await updatePoolBalance()

    markOvenLiquidated(oven.ovenAddress)
  } catch (e: any) {
    handleWalletError(e, 'Unable To Liquidate Oven', 'We were unable to liquidate the selected oven.')
  } finally {
    txPending.value = false
  }
}

const markOvenLiquidated = (ovenAddress: string) => {
  if (!store.allOvensData) return
  const ovenIndex = store.allOvensData.findIndex((oven: OvenData) => oven.ovenAddress === ovenAddress)
  if (ovenIndex !== -1) {
    store.allOvensData[ovenIndex].isLiquidated = true
  }
}

const depositkUSD = async () => {
  txPending.value = true
  try {
    const lpContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
    const kUSDContract = await store.tezosToolkit.wallet.at(store.lpTokenAddress!)

    const sendAmt = new BigNumber(depositInput.value).multipliedBy(SHARD)

    const sendResult = await store.tezosToolkit.wallet.batch([])
      .withContractCall(kUSDContract.methodsObject.approve(store.NETWORK_CONTRACTS.LIQUIDITY_POOL, sendAmt))
      .withContractCall(lpContract.methodsObject.deposit(sendAmt))
      .send()

    $eventBus.emit('tx-submitted', sendResult)

    console.log(sendResult)

    await sendResult.confirmation(1)

    $eventBus.emit('refresh-holdings')

    poolBalance.value = null
    await updatePoolBalance()
  } catch (e: any) {
    handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
  } finally {
    txPending.value = false
    $eventBus.emit('tx-finished')
    depositInput.value = ''
  }
}

const redeemLPTokens = async () => {
  txPending.value = true
  try {
    const lpContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
    const redeemAmt = new BigNumber(redeemInput.value).multipliedBy(store.lpMantissa)

    const sendResult = await store.tezosToolkit.wallet.batch([])
      .withContractCall(lpContract.methodsObject.redeem(redeemAmt.toFixed(0)))
      .send()

    console.log(sendResult)

    await sendResult.confirmation(1)

    redeemInput.value = ''

    $eventBus.emit('refresh-holdings')

    poolBalance.value = null
    await updatePoolBalance()
  } catch (e: any) {
    handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
  } finally {
    txPending.value = false
  }
}

onMounted(async () => {
  if (!store.isTestnet && !store.isSandbox) {
    warningModalOpen.value = true
  }

  if (store.lpData === null) {
    const lpContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.LIQUIDITY_POOL)
    store.lpData = await lpContract.storage()
    store.lpTokenAddress = store.lpData.tokenAddress
  }

  await updatePoolBalance()
})
</script>

<template>
  <div class="liquidity-pool animate__animated animate__fadeIn">
    <Transition
      enter-active-class="animate__fadeIn"
      leave-active-class="animate__fadeOut"
    >
      <div v-if="warningModalOpen" :class="{ 'is-active': warningModalOpen }" class="modal animate__animated animate__fast">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Safety Warning</p>
          </header>
          <section class="modal-card-body">
            <div class="content">
              <h4 class="title">The Kolibri Liquidity Pool has <span class="has-text-danger">not</span> undergone a security review.</h4>
              <p>It has <span class="has-text-danger has-text-weight-bold">not</span> been audited by a 3rd party firm for security issues or correctness of operation, and while we've made efforts to review and test the pool, software bugs may still occur which could result in loss of funds.</p>
              <p>You can find the source code for this liquidity pool at <a target="_blank" rel="noopener" href="https://github.com/Hover-Labs/liquidation-pool"><b>Hover-Labs/Liquidation-Pool</b></a></p>
              <p><b>Use this pool at your own risk!</b></p>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button class="button is-primary has-text-weight-bold" @click="warningModalOpen = !warningModalOpen">Acknowledge</button>
          </footer>
        </div>
      </div>
    </Transition>

    <div class="columns is-centered">
      <div class="column is-two-thirds-tablet">
        <div class="box is-paddingless">
          <div class="topper">
            <img class="pool" src="~/assets/pool.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Liquidity Pool</h3>
              <NuxtLink to="/docs/components/liquidity-pool" class="button is-outlined is-white">Learn More</NuxtLink>
            </div>
          </div>

          <div v-if="store.lpDisabled">
            <div class="notification is-warning warning-banner">
              <div class="block">
                <p>
                  The liquidity pool is <b>currently disabled</b> and unable to act as a primary protocol liquidator. It was disabled in <a href="https://governance.kolibri.finance/proposals/12" target="_blank" rel="noopener"><b>DAO Proposal #12</b></a> in response to a security vulnerability.
                  <br>
                  <br>
                  Liquidations through the pool won't work until the pool is reactivated via the DAO. Deposits and farming are still enabled. <a href="https://kolibri-xtz.medium.com/kolibri-liquidity-pool-exploit-postmortem-f738966c20fb" target="_blank" rel="noopener"><b>Learn More</b></a>
                </p>
              </div>
            </div>
          </div>

          <div v-if="store.lpData !== null && poolBalance !== null">
            <nav class="level lp-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Pool Size</p>
                  <p class="title">{{ formatNumber(poolBalance.dividedBy(Math.pow(10, 18)).toFixed(2)) }} <span class="heading is-inline-block">kUSD</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Liquidation Reward</p>
                  <p class="title">{{ store.lpData.rewardPercent }}%</p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">LP Tokens Total</p>
                  <p class="title">{{ formatNumber(store.lpData.totalSupply.dividedBy(store.lpMantissa).toFixed(2)) }}</p>
                </div>
              </div>
            </nav>
            <div class="container has-text-centered">
              <p><strong>1 QLkUSD</strong> is currently redeemable for <strong>{{ poolBalance.dividedBy(Math.pow(10, 18)).dividedBy(store.lpData.totalSupply.dividedBy(store.lpMantissa)).toFixed(2) }} kUSD</strong></p>
            </div>
          </div>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-primary"></div>
          </div>

          <div v-if="store.wallet !== null" class="manage-liquidity-pool">
            <hr>
            <div class="container holdings is-justify-content-space-around is-flex">
              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="store.walletBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a class="has-text-white" @click="depositInput = store.walletBalance!.dividedBy(Math.pow(10, 18)).toString()">{{ numberWithCommas(walletBalanceFormatted!.toFixed(2)) }} kUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">LP Holdings</span>
                <span v-if="store.lpBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a class="has-text-white" @click="redeemInput = store.lpBalance!.dividedBy(store.lpMantissa).toString()">{{ numberWithCommas(store.lpBalance!.dividedBy(store.lpMantissa).toFixed(2)) }} QLkUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>
            </div>
          </div>

          <div v-if="store.wallet !== null" class="management-buttons">
            <hr>
            <div>
              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Deposit</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input v-model="depositInput" class="input" type="number" placeholder="10">
                      <div
                        class="max-button heading"
                        @click="depositInput = store.walletBalance!.dividedBy(Math.pow(10, 18)).toString()"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        kUSD
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{ 'is-loading': txPending }" :disabled="!depositInput || txPending" class="button is-primary has-text-weight-bold action-button" @click="depositkUSD">Deposit kUSD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Redeem</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons">
                    <div class="control is-expanded">
                      <input v-model="redeemInput" class="input" type="number" placeholder="10">
                      <div
                        class="max-button heading"
                        @click="redeemInput = store.lpBalance!.dividedBy(store.lpMantissa).decimalPlaces(36).toString()"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        QLkUSD
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{ 'is-loading': txPending }" :disabled="!redeemInput || txPending" class="button is-primary action-button has-text-weight-bold" @click="redeemLPTokens">Redeem LP Tokens</button>
                    </div>
                  </div>
                </div>
              </div>

              <p v-if="store.lpBalance !== null && store.lpData !== null" class="has-text-centered lp-value">
                Your <b>{{ numberWithCommas(store.lpBalance!.dividedBy(store.lpMantissa).toFixed(2)) }} QLkUSD</b> is <b>~{{ store.lpBalance!.dividedBy(store.lpData.totalSupply).times(100).toFixed(2) }}%</b> of the total supply, entitling you to <b>{{ formatNumber(store.lpBalance!.dividedBy(store.lpData.totalSupply).times(poolBalance!).dividedBy(Math.pow(10, 18)).toFixed(2)) }} kUSD</b> if you redeem it right now.
              </p>
            </div>
          </div>
          <div v-else class="content">
            <hr>
            <h2 class="has-text-centered">Connect your wallet</h2>
            <p class="has-text-centered">Please connect your wallet to get started!</p>
            <div class="buttons is-centered">
              <button class="button is-primary has-text-weight-bold" @click="$eventBus.emit('wallet-connect-request')">Connect Wallet</button>
            </div>
          </div>

          <hr>

          <div class="liquidatable-ovens content">
            <h2 class="title has-text-centered">Liquidatable Ovens</h2>
            <template v-if="liquidatableOvens === null">
              <div class="loader-wrapper">
                <div class="loader is-large is-primary"></div>
              </div>
            </template>
            <template v-else>
              <div v-if="!liquidatableOvens.length">
                <div class="has-text-centered loader-wrapper">
                  <p>There are no liquidatable ovens currently!</p>
                </div>
              </div>
              <template v-else-if="!store.lpDisabled">
                <PublicOven
                  v-for="oven in liquidatableOvens"
                  :key="oven.ovenAddress"
                  :compact="true"
                  :oven="oven"
                >
                  <template #liquidation-button>
                    <button
                      :disabled="txPending"
                      :class="{ 'is-loading': txPending }"
                      class="button is-danger is-small"
                      @click="liquidateOven(oven)"
                    >
                      Liquidate
                    </button>
                  </template>
                </PublicOven>
              </template>
              <div v-else>
                <div class="has-text-centered loader-wrapper">
                  <b>Liquidations via the pool are currently disabled.</b>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" type="text/scss">
  .liquidity-pool{
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .button.is-static{
      min-width: 7rem;
    }
    .action-button{
      min-width: 12rem;
    }
    .liquidatable-ovens{
      padding: 0 1rem 1rem;
      .loader-wrapper{
        padding: 1rem;
      }
    }
    .management-buttons{
      padding: 0;
      @include until($desktop){
        background: blue;
      }
    }
    .manage-liquidity-pool{
      .holdings{
        & > .title{
          padding: 1rem 2rem;
        }
      }
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .pool{
        width: 50%;
        padding: 2rem;
      }
      .words {
        width: 35%;
        padding-left: 1rem;
        color: white;
      }
    }
    .level.lp-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .loader-wrapper{
      padding: 1.3rem 1.3rem 0.3rem;
      margin-top: .5rem;
    }
    .lp-value{
      padding: 1rem 3rem 0;
    }

    .control{
      &:hover{
        .max-button{
          opacity: 1;
        }
      }
      input:focus + .max-button{
        opacity: 1;
      }
    }
    .max-button{
      position: absolute;
      top: 0.75rem;
      color: $primary;
      right: .5rem;
      font-weight: bold;
      cursor: pointer;
      border-bottom: 1px solid transparent;
      z-index: 9;
      opacity: 0;
      transition: opacity 250ms linear;
      &:hover{
        border-bottom: 1px solid $primary;
      }
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }

    .warning-banner{
      border-radius: 0;
    }

  }
</style>
