<script setup lang="ts">
import BigNumber from 'bignumber.js'
import axios from 'axios'
import { SHARD } from '~/utils/constants'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { numberWithCommas, formatNumber } = useFormatting()
const { handleWalletError } = useTransactions()
const { tzktAPILink } = useLinks()

const savingsRateStorage = ref<any>(null)
const savingsRateContract = ref<any>(null)
const ksrBalance = ref<BigNumber | null>(null)
const depositInput = ref<string | number>('')
const redeemInput = ref<string | number>('')
const now = ref(Date.now())
const txPending = ref(false)
const spClient = ref<any>(null)
const lockedkUSD = ref<number | null>(null)
const currentInterestRate = ref<string | null>(null)
const ksrTokenTotal = ref<BigNumber | null>(null)
const recentTransactions = ref<any[] | null | false>(null)
const warningModalOpen = ref(false)
const balancesUpdated = ref(false)

const walletBalanceFormatted = computed(() =>
  store.walletBalance?.dividedBy(SHARD),
)

let nowTimer: ReturnType<typeof setInterval> | null = null
let poolSizeTimer: ReturnType<typeof setInterval> | null = null

const updateTotals = async () => {
  balancesUpdated.value = false

  savingsRateStorage.value = await savingsRateContract.value.storage()

  currentInterestRate.value = null
  ksrTokenTotal.value = null
  ksrBalance.value = null
  recentTransactions.value = null

  currentInterestRate.value = (await spClient.value.getInterestRateAPY(savingsRateStorage.value)).toFixed(2)
  ksrTokenTotal.value = (await spClient.value.getLPTokenTotal(savingsRateStorage.value)).dividedBy(new BigNumber(10).pow(36))
  lockedkUSD.value = (await spClient.value.getPoolSize(savingsRateStorage.value)).dividedBy(new BigNumber(10).pow(18)).toNumber()
  await updateKSRBalance()

  const apiLink = tzktAPILink()
  if (apiLink !== null) {
    recentTransactions.value = (await axios.get(`${apiLink}/v1/operations/transactions`, {
      params: {
        sender: store.walletPKH,
        target: store.NETWORK_CONTRACTS.SAVINGS_POOL,
        status: 'applied',
        limit: 10,
        'sort.desc': 'id',
        'entrypoint.in': 'deposit,redeem',
      },
    })).data
  } else {
    recentTransactions.value = false as any
  }

  balancesUpdated.value = true
}

const updateKSRBalance = async () => {
  if (store.walletPKH === null) return

  let balance = await savingsRateStorage.value.balances.get(store.walletPKH)
  if (balance === undefined) {
    balance = new BigNumber(0)
  } else {
    balance = balance.balance
  }
  ksrBalance.value = balance
}

const depositkUSD = async () => {
  txPending.value = true
  try {
    const kUSDContract = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.TOKEN)
    const sendAmt = new BigNumber(depositInput.value).multipliedBy(SHARD)

    const sendResult = await store.tezosToolkit.wallet.batch([])
      .withContractCall(kUSDContract.methodsObject.approve(spClient.value.savingsPoolAddress, sendAmt))
      .withContractCall(await spClient.value.makeDepositTransaction(sendAmt, savingsRateContract.value))
      .send()

    $eventBus.emit('tx-submitted', sendResult)

    console.log(sendResult)

    await sendResult.confirmation(1)

    $eventBus.emit('refresh-holdings')
    await updateTotals()
  } catch (e: any) {
    handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
  } finally {
    txPending.value = false
    $eventBus.emit('tx-finished')
    depositInput.value = ''
  }
}

const redeemKSR = async () => {
  txPending.value = true
  try {
    const redeemAmt = new BigNumber(redeemInput.value).multipliedBy(store.lpMantissa)
    const sendResult = await spClient.value.redeem(redeemAmt, savingsRateContract.value)

    $eventBus.emit('tx-submitted', sendResult)

    console.log(sendResult)

    await sendResult.confirmation(1)

    $eventBus.emit('refresh-holdings')
    await updateTotals()
  } catch (e: any) {
    handleWalletError(e, 'Unable To Redeem KSR', 'We were unable to redeem KSR for kUSD.')
  } finally {
    txPending.value = false
    $eventBus.emit('tx-finished')
    redeemInput.value = ''
  }
}

onMounted(async () => {
  if (!store.isTestnet && !store.isSandbox) {
    warningModalOpen.value = true
  }

  savingsRateContract.value = await store.tezosToolkit.wallet.at(store.NETWORK_CONTRACTS.SAVINGS_POOL)
  savingsRateStorage.value = await savingsRateContract.value.storage()

  spClient.value = store.getSavingsPoolClient(store.wallet, store.NETWORK_CONTRACTS.SAVINGS_POOL)
  await updateTotals()

  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  if (store.walletPKH === null) {
    $eventBus.on('wallet-connected', updateTotals)
  }

  poolSizeTimer = setInterval(async () => {
    lockedkUSD.value = (await spClient.value.getPoolSize(savingsRateStorage.value)).dividedBy(new BigNumber(10).pow(18)).toNumber()
  }, 5000)
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
  if (poolSizeTimer) clearInterval(poolSizeTimer)
  $eventBus.off('wallet-connected', updateTotals)
})
</script>

<template>
  <div class="savings-rate animate__animated animate__fadeIn">
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
              <h4 class="title">The Kolibri Savings Rate contract has <span class="has-text-danger">not</span> undergone a security review yet.</h4>
              <p>It has <span class="has-text-danger has-text-weight-bold">not</span> been audited by a 3rd party firm for security issues or correctness of operation, and while we've made efforts to review and test the pool, software bugs may still occur which could result in loss of funds.</p>
              <p>You can find the source code for this savings rate contract at <a target="_blank" rel="noopener" href="https://github.com/Hover-Labs/kolibri-contracts/blob/master/smart_contracts/savings-pool.py"><b>hover-labs/kolibri-contracts</b></a></p>
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
            <img class="savings-rate-logo" src="~/assets/savings-rate.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Savings Rate</h3>
              <NuxtLink to="/docs/components/savings-rate" class="button is-outlined is-white">Learn More</NuxtLink>
            </div>
          </div>

          <div v-if="balancesUpdated === true">
            <nav class="level sr-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Total Pool Size</p>
                  <p class="title">{{ formatNumber(lockedkUSD!, 2) }} <span class="heading is-inline-block">kUSD</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Interest Rate</p>
                  <p class="title">{{ currentInterestRate }}<span class="heading is-inline-block">%</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">KSR Supply</p>
                  <p class="title">{{ formatNumber(ksrTokenTotal!.toNumber()) }} <span class="heading is-inline-block">KSR</span></p>
                </div>
              </div>
            </nav>
          </div>
          <div v-else class="loader-wrapper stats-loader">
            <div class="loader is-large is-primary"></div>
          </div>

          <div v-if="store.wallet !== null" class="manage-liquidity-pool">
            <hr>
            <div class="container holdings is-justify-content-space-around is-flex">
              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="store.walletBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a class="has-text-white" @click="depositInput = store.walletBalance!.dividedBy(Math.pow(10, 18)).toFixed(18)">{{ numberWithCommas(walletBalanceFormatted!.toFixed(2)) }} kUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">KSR Holdings</span>
                <span v-if="ksrBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a class="has-text-white" @click="redeemInput = ksrBalance!.dividedBy(store.lpMantissa).toFixed(36)">{{ numberWithCommas(ksrBalance!.dividedBy(store.lpMantissa).toFixed(2)) }} KSR</a>
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
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="depositInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="store.walletBalance !== null"
                        class="max-button heading"
                        @click="depositInput = store.walletBalance!.dividedBy(Math.pow(10, 18)).toFixed(18)"
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
                      <button :class="{ 'is-loading': txPending }" :disabled="!depositInput || txPending" class="button action-button is-primary has-text-weight-bold" @click="depositkUSD">Deposit kUSD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Redeem</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="redeemInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="ksrBalance !== null"
                        class="max-button heading"
                        @click="redeemInput = ksrBalance!.dividedBy(store.lpMantissa).toFixed(36)"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        KSR
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{ 'is-loading': txPending }" :disabled="!redeemInput || txPending" class="button action-button is-primary has-text-weight-bold" @click="redeemKSR">Redeem KSR</button>
                    </div>
                  </div>
                </div>
              </div>

              <hr class="is-marginless">

              <p v-if="ksrBalance !== null" class="has-text-centered ksr-value">
                Your <b>{{ numberWithCommas(ksrBalance!.dividedBy(store.lpMantissa).toFixed(2)) }} KSR</b> is <b>~{{ ksrBalance!.dividedBy(ksrTokenTotal!).dividedBy(1e36).times(100).toFixed(2) }}%</b> of the total KSR supply, entitling you to <b>{{ formatNumber(ksrBalance!.times(new BigNumber(lockedkUSD!).dividedBy(ksrTokenTotal!)).dividedBy(1e36).toNumber(), 2) }} kUSD</b> if you redeem it right now.
              </p>
              <div v-else class="loader-wrapper words-loader">
                <div class="loader is-large is-primary"></div>
              </div>

              <hr class="is-marginless">

              <div v-if="recentTransactions !== null" class="recent-transactions">
                <div v-if="recentTransactions === false" class="has-text-centered large-padding">
                  <p>Sandbox doesn't have a tzkt.io indexer to use!</p>
                </div>
                <div v-else>
                  <RecentActivityEntry v-for="tx in (recentTransactions as any[])" :key="tx.id" :now="now" :tx="tx" />
                  <div v-if="(recentTransactions as any[]).length === 0" class="has-text-centered large-padding">
                    <p>No recent transactions...yet!</p>
                  </div>
                </div>
              </div>
              <div v-else class="loader-wrapper large-padding">
                <div class="loader is-large is-primary"></div>
              </div>
            </div>
          </div>
          <div v-else class="content wallet-connect">
            <hr>
            <h2 class="has-text-centered">Connect your wallet</h2>
            <p class="has-text-centered">Please connect your wallet to get started!</p>
            <div class="buttons is-centered">
              <button class="button is-primary has-text-weight-bold" @click="$eventBus.emit('wallet-connect-request')">Connect Wallet</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" type="text/scss">
  .savings-rate{
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .timestamp-title{
      display: flex;
      align-items: center;
    }
    .recent-transactions{
      padding: 1rem;
    }
    .loader-wrapper.large-padding, .has-text-centered.large-padding{
      padding: 5rem 1rem;
    }
    .button.is-static{
      min-width: 5rem;
    }
    .action-button{
      min-width: 9rem;
    }
    .input-50{
      width: 50%;
    }
    .sr-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .wallet-connect{
      padding-bottom: 2.5rem;
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .savings-rate-logo{
        width: 50%;
        padding: 2rem;
        max-height: 24rem;
      }
      .words {
        width: 35%;
        padding-left: 1rem;
        color: white;
      }
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

    .ksr-value{
      padding: 1.5rem;
    }
    .words-loader{
      padding: 1.65rem 1rem;
    }
    .stats-loader{
      padding: 4.5rem;
    }

    .management-buttons{
      @include until($tablet){
        > div > div.field{
          padding: 1rem 2rem;
          .input-50{
            width: 100%;
          }
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
    input[type=number] {
      -moz-appearance: textfield;
    }
  }
</style>
