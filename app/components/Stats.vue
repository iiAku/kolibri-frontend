<template>
  <div class="stats">
    <nav class="level">
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Active Ovens</p>
          <p v-if="store.ovenCount === null" class="loader"></p>
          <p v-else class="title">{{ store.ovenCount }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Stability Fee (yearly)</p>
          <p v-if="store.stabilityFee === null" class="loader"></p>
          <p v-else-if="typeof store.stabilityFee === 'string'" class="title">{{ store.stabilityFee }}</p>
          <p v-else class="title">{{ formattedStabilityFee }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">
            Collateral Ratio
            <Popover>
              <template #popup-content>
                <span>
                  <span>
                    The collateral ratio determines how much collateral you need to back your minted kUSD with.
                    <br>
                    A ratio of 150% means for every 1 kUSD you mint, you need at *least* $1.50 worth of XTZ.
                  </span>
                </span>
              </template>
              <span>(<a class="has-text-primary has-text-weight-bold">?</a>)</span>
            </Popover>
          </p>
          <p v-if="store.collateralRate === null" class="loader"></p>
          <p v-else class="title">{{ formattedCollateralRate }}%</p>
        </div>
      </div>
    </nav>

    <div class="peg-data is-flex is-flex-direction-column is-align-items-center">
      <p class="heading">
        kUSD Price / Peg Depth -
        <span v-if="pegData !== null">
          <strong>${{ pegData.currentkUSDPrice }}</strong> / <strong>{{ formatNumber(pegData.deltaForPeg.pegDepth.dividedBy(1e18), 2) }} kUSD</strong>
        </span>
        <strong v-else><span class="tiny-loader loader"></span></strong>
        <Popover>
          <template #popup-content>
            <span>
              <span>
                The kUSD <b>"peg"</b> is tracked against the <b><a target="_blank" rel="noopener" :href="harbingerLink">Harbinger</a></b> price feed,
                <br>
                which is a <b><a target="_blank" rel="noopener" href="https://www.investopedia.com/terms/v/vwap.asp">VWAP</a></b> of <b><a href="https://pro.coinbase.com/trade/XTZ-USD" rel="noopener" target="_blank">Coinbase Pro</a></b> data for the XTZ/USD pair.
              </span>
              <br><br>
              <span>
                The <b><NuxtLink target="_blank" to="/docs">Peg Depth</NuxtLink></b> is a measurement of the amount of <br> kUSD needed to be bought or sold to move the peg by <b>1%</b>.
              </span>
            </span>
          </template>
          <span>(<a class="has-text-primary has-text-weight-bold">?</a>)</span>
        </Popover>
      </p>
      <PegVisualizer @peg-stats="pegData = $event" />
    </div>

    <div v-if="!showAll" class="seperator is-relative">
      <div class="more has-text-centered">
        <a @click="showAll = true" class="more-link heading">
          More <i class="arrow down"></i>
        </a>
      </div>

      <hr />
    </div>
    <div class="animate__animated animate__fadeIn bottom-stats" v-else>
      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">All Tez in Kolibri Ovens</p>
            <p v-if="store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof store.balanceData === 'string'" class="title"> {{ store.balanceData }} </p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    store.balanceData.totalBalance.dividedBy(1e6).toFixed(0)
                )
              }}
              <span class="subtitle">ꜩ</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Value Of All Ovens</p>
            <p v-if="store.priceData === null || store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof store.balanceData === 'string'" class="title">{{ store.balanceData }}</p>
            <p v-else class="title">
              ${{
                numberWithCommas(
                    (
                        store.balanceData.totalBalance
                            .dividedBy(Math.pow(10, 6))
                            .times(store.priceData.price.dividedBy(Math.pow(10,6)))
                    ).toFixed(0)
                )
              }}
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Total kUSD In Existence</p>
            <p v-if="store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof store.balanceData === 'string'" class="title">{{ store.balanceData }}</p>
            <p v-else class="title">
              {{ numberWithCommas(store.balanceData.totalTokens.toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Current Debt Ceiling</p>

            <p v-if="store.debtCeiling === null" class="loader"></p>
            <p v-else class="title">
              {{ numberWithCommas(store.debtCeiling.dividedBy(Math.pow(10, 18)).toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Stability Fund</p>

            <p v-if="store.stabilityFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    store.stabilityFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Development Fund</p>

            <p v-if="store.devFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    store.devFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <div class="seperator is-relative">
        <div class="more has-text-centered">
          <a @click="showAll = false" class="more-link heading">
            Less <i class="arrow up"></i>
          </a>
        </div>

        <hr />
      </div>
    </div>

    <div
      class="container price-container is-flex is-align-items-center is-justify-content-center"
    >
      <h1 class="subtitle is-marginless has-text-weight-normal">
        Latest
        <a :href="harbingerLink" target="_blank" rel="noopener">
          XTZ/USDT Oracle
        </a>
        Price:
      </h1>
      <div class="price-data">
        <p v-if="store.priceData === null" class="loader is-small"></p>
        <p v-else class="title is-5 is-marginless">
          ${{
            store.priceData.price
              .dividedBy(Math.pow(10, 6))
              .toFixed(2)
              .toLocaleString()
          }}
        </p>
      </div>
    </div>
    <p class="heading last-update-time">
      Oracle Last Updated
      <span
        v-if="store.priceData === null"
        class="loader is-small is-inline-block"
      ></span>
      <strong v-else>
        <Popover v-if="durationMs(store.priceData.timestamp) > 30 * 60 * 1000">
          <template #popup-title>
            <strong class="has-text-danger">Warning</strong>
          </template>
          <template #popup-content>
            <strong>
              The price oracle has lagged behind longer than 30 minutes, so most
              functionality has been disabled by the protocol.
            </strong>
          </template>
          <span class="has-text-danger">
            {{ humanTime(store.priceData.timestamp) }} Ago
          </span>
        </Popover>

        <Popover v-else-if="durationMs(store.priceData.timestamp) > 25 * 60 * 1000">
          <template #popup-title>
            <strong class="has-text-danger">Warning</strong>
          </template>
          <template #popup-content>
            <strong>
              The price oracle seems to be lagging behind. If the oracle is more
              than 30 mins off, some functionality within the ovens is disabled
              by the protocol out of an abundance of caution.
            </strong>
          </template>
          <span>{{ humanTime(store.priceData.timestamp) }} Ago</span>
        </Popover>

        <span v-else>{{ humanTime(store.priceData.timestamp) }} Ago</span>
      </strong>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BigNumber from 'bignumber.js'
import { ConversionUtils } from '~/lib/kolibri'
import axios from 'axios'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { SHARD } from '~/utils/constants'

const store = useKolibriStore()
const { numberWithCommas, formatNumber, formatDuration } = useFormatting()

const now = ref(Date.now())
const showAll = ref(false)
const pegData = ref<any>(null)

let nowTimer: ReturnType<typeof setInterval> | null = null
let statsUpdateTimer: ReturnType<typeof setInterval> | null = null

const harbingerLink = computed(() => {
  if (store.isTestnet) return 'https://testnet.harbinger.live'
  if (store.isSandbox) return 'https://sandbox.harbinger.live'
  return 'https://harbinger.live'
})

const formattedStabilityFee = computed(() =>
  ConversionUtils.shardToHumanReadablePercentage(store.stabilityFee!, 2),
)

const formattedCollateralRate = computed(() => {
  if (store.lpDisabled) {
    return store.collateralRate!.minus(store.privateLiquidationThreshold!).dividedBy(SHARD)
  }
  return store.collateralRate!.dividedBy(SHARD)
})

const durationMs = (timestamp: number): number => {
  return now.value - new Date(timestamp).getTime()
}

const humanTime = (timestamp: number): string => {
  const ms = durationMs(timestamp)
  return formatDuration(ms)
}

const updateStatsData = () => {
  store.stableCoinClient.getOvenCount()
    .then((count: number) => {
      store.ovenCount = count
    })
    .catch((err: any) => {
      if (statsUpdateTimer) {
        clearInterval(statsUpdateTimer)
        statsUpdateTimer = null
      }
      console.error('Error getting oven count ', err)
      store.ovenCount = null
    })

  axios
    .get(`https://kolibri-data.s3.amazonaws.com/${store.network}/totals.json`)
    .then((result) => {
      const { totalBalance, totalTokens } = result.data
      store.balanceData = {
        totalBalance: new BigNumber(totalBalance),
        totalTokens: new BigNumber(totalTokens),
      }
    })
    .catch((err) => {
      if (statsUpdateTimer) {
        clearInterval(statsUpdateTimer)
        statsUpdateTimer = null
      }
      console.error('Error getting oven count ', err)
      store.balanceData = null
    })

  store.tezosToolkit.contract.at(store.NETWORK_CONTRACTS.TOKEN)
    .then(async (token: any) => {
      const storage = await token.storage() as any
      store.debtCeiling = storage.debtCeiling
    })

  store.tokenClient.getBalance(store.NETWORK_CONTRACTS.STABILITY_FUND)
    .then((holdings: BigNumber) => {
      store.stabilityFundHoldings = holdings
    })

  store.tokenClient.getBalance(store.NETWORK_CONTRACTS.DEVELOPER_FUND)
    .then((holdings: BigNumber) => {
      store.devFundHoldings = holdings
    })
}

onMounted(() => {
  nowTimer = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  statsUpdateTimer = setInterval(updateStatsData, 30 * 1000)

  updateStatsData()
})

onUnmounted(() => {
  if (nowTimer) clearInterval(nowTimer)
  if (statsUpdateTimer) clearInterval(statsUpdateTimer)
})
</script>

<style lang="scss">
.stats {
  .more{
    position: absolute;
    top: -0.75rem;
    right: 0;
    left: 0;
    .more-link{
      display: inline-block;
      background: white;
      padding: .25rem .5rem;
      border-radius: 5px;
      border: 1px solid whitesmoke;
      &:hover{
        .arrow{
          border: solid $grey-dark;
          border-width: 0 1px 1px 0;
        }
      }
    }
  }

  .arrow {
    border: solid $primary;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 2px;
    margin-bottom: 0.15rem;
    &.down{
      transform: rotate(45deg);
      -webkit-transform: rotate(45deg);
    }
    &.up{
      transform: rotate(225deg);
      -webkit-transform: rotate(225deg);
    }
  }
  .loader {
    height: 2rem;
    width: 2rem;
    margin-top: 0.25rem;
    &.is-small {
      height: 1rem;
      width: 1rem;
    }
  }
  .last-update-time {
    text-align: center;
    margin: 0.5rem 0 0;
    .loader {
      margin-bottom: -4px;
    }
    .popper {
      max-width: 30rem;
      strong,
      p {
        text-transform: initial;
      }
    }
  }
  .price-container {
    a {
      border-bottom: 1px solid $grey-darker;
      font-weight: bold;
      color: $grey-darker;
      &:hover {
        color: $primary;
        border-bottom: 1px solid $primary;
      }
    }
    .subtitle {
      padding-right: 0.5rem;
    }
    .price-data {
      min-width: 4.625rem;
    }
  }
  .peg-data{
    padding-bottom: 0.75rem;
    .loader.tiny-loader{
      display: inline-block;
      height: 0.5rem;
      width: 0.5rem;
      margin: 0;
    }
    strong{
      &.green{
        color: $primary;
      }
      &.yellow{
        color: $warning;
      }
      &.red{
        color: $danger;
      }
    }
  }
  .bottom-stats{
    margin-top: 1rem;
  }
}
</style>
