<template>
  <div class="box oven public-oven">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5 is-family-monospace"><a target="_blank" rel="noopener" :href="`https://better-call.dev/delphinet/${ovenAddress}/`">{{ovenAddress}}</a></h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <h1 class="title is-5">Owner: <a target="_blank" rel="noopener" class="is-family-monospace" :href="`https://better-call.dev/delphinet/${ovenOwner}/`">{{ovenOwner}}</a></h1>
          </div>
        </div>
      </nav>
    </div>

    <div v-if="ovenData !== null" class="oven-info">
      <div class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://delphinet.tzkt.io/${ovenData.baker}/delegators`">{{ ovenData.baker }}</a></strong></p>
            <p class="heading">Collateral Utilization: <strong>{{ collatoralizedRate(ovenData.balance) }}%</strong>
              | Can borrow up to
              <popover extra-classes="small-price">
                <strong slot="popup-content" class="has-text-primary heading is-marginless">
                  {{maxBorrowAmt(ovenData.balance)}} kUSD
                </strong>

                <strong class="price-has-popover">{{ maxBorrowAmt(ovenData.balance).toFixed(2) }} kUSD</strong>
              </popover>

            <div class="allocation-info is-fullwidth">
              <progress class="progress is-primary" :value="collatoralizedRate(ovenData.balance)" max="100">{{ collatoralizedRate(ovenData.balance) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info">
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Vault Value (USD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    ${{ ovenValue(ovenData.balance) }} USD
                  </strong>

                  <strong class="price-has-popover">${{ ovenValue(ovenData.balance).toFixed(2) }} USD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (ꜩ)</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong slot="popup-content" class="has-text-primary heading is-marginless">
                      {{ (parseInt(ovenData.balance) / Math.pow(10, 6)) }} ꜩ
                    </strong>

                    <strong class="price-has-popover">{{ (parseInt(ovenData.balance) / Math.pow(10, 6)).toFixed(2) }} ꜩ</strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (KUSD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ (parseInt(ovenData.borrowedTokens) / Math.pow(10, 18)) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ (parseInt(ovenData.borrowedTokens) / Math.pow(10, 18)).toFixed(2) }} kUSD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ (parseInt(ovenData.stabilityFee) / Math.pow(10, 18)) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ (parseInt(ovenData.stabilityFee) / Math.pow(10, 18)).toFixed(6) }} kUSD</strong>
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
    <div v-else class="loader-wrapper">
      <h1 class="title is-marginless is-5">Loading Oven Data...</h1><div class="loader left-spaced"></div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Mixins from "@/mixins";
import Popover from "@/components/Popover";

export default {
  name: 'PublicOven',
  props: ['ovenAddress', 'ovenOwner'],
  mixins: [Mixins],
  async created(){
    await this.updateOvenData()
  },
  methods: {
    ovenValue(ovenBalance){
      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      return currentValue.toNumber() / Math.pow(10, 2)
    },
    maxBorrowAmt(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let borrowedTokens = this.ovenData.borrowedTokens.dividedBy(Math.pow(10, 18))

      return valueHalf.minus(borrowedTokens).dividedBy(100)
    },
    collatoralizedRate(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let rate = this.ovenData.borrowedTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 14))

      return rate.toFixed(2)
    },
    async updateOvenData(){
      const keys = ['baker', 'balance', 'borrowedTokens', 'stabilityFee', 'outstandingTokens']

      const values = await Promise.all([
        this.ovenClient.getBaker(),
        this.ovenClient.getBalance(),
        this.ovenClient.getBorrowedTokens(),
        this.ovenClient.getStabilityFees(),
        this.ovenClient.getTotalOutstandingTokens(),
      ])

      this.ovenData = _.zipObject(keys, values)

      if (this.ovenData.balance.toNumber() === 0) {
        this.$emit('is-empty')
      }
    },
  },
  data(){
    return {
      ovenData: null
    }
  },
  computed: {
    ovenClient(){
      return this.$store.getOvenClient(this.$store.wallet, this.ovenAddress)
    }
  },
  components: {
    Popover
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .public-oven {
    @include until($desktop){
      .level-item{
        white-space: nowrap;
        .title{
          text-overflow: ellipsis;
          max-width: 90vw;
          overflow: hidden;
        }
      }
    }
  }
</style>
