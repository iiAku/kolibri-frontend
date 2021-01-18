<template>
  <div class="box oven public-oven">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5 is-family-monospace"><a target="_blank" rel="noopener" :href="`https://better-call.dev/delphinet/${oven.ovenAddress}/`">{{oven.ovenAddress}}</a></h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <h1 class="title is-5">Owner: <a target="_blank" rel="noopener" class="is-family-monospace" :href="`https://better-call.dev/delphinet/${oven.ovenOwner}/`">{{oven.ovenOwner}}</a></h1>
          </div>
        </div>
      </nav>
    </div>

    <div class="oven-info">
      <div v-if="oven.isLiquidated" class="liquidated-warning">
        <h1 class="title is-4 has-text-white">This Oven Has Been <router-link rel="noopener" target="_blank" :to="{name: 'ProjectInfo', params: {folder: 'liquidation', page: 'overview'}}">Liquidated</router-link></h1>
      </div>
      <div class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://delphinet.tzkt.io/${oven.baker}/delegators`">{{ oven.baker }}</a></strong></p>
            <p class="heading">Collateral Utilization: <strong>{{ collatoralizedRate(oven.balance) }}%</strong>
              | Can borrow up to
              <popover extra-classes="small-price">
                <strong slot="popup-content" class="has-text-primary heading is-marginless">
                  {{ numberWithCommas(maxBorrowAmt(oven.balance)) }} kUSD
                </strong>

                <strong class="price-has-popover">{{ numberWithCommas(maxBorrowAmt(oven.balance).toFixed(2)) }} kUSD</strong>
              </popover>

            <div class="allocation-info is-fullwidth">
              <progress class="progress is-primary" :value="collatoralizedRate(oven.balance)" max="100">{{ collatoralizedRate(oven.balance) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info">
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Collateral Value</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    ${{ numberWithCommas(ovenValue(oven.balance)) }} USD
                  </strong>

                  <strong class="price-has-popover">${{ numberWithCommas(ovenValue(oven.balance).toFixed(2)) }} USD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong slot="popup-content" class="has-text-primary heading is-marginless">
                      {{ numberWithCommas(oven.balance.dividedBy(Math.pow(10, 6))) }} ꜩ
                    </strong>

                    <strong class="price-has-popover">{{ numberWithCommas(oven.balance.dividedBy(Math.pow(10, 6)).toFixed(2)) }} ꜩ</strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Borrowed Tokens</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ numberWithCommas(oven.borrowedTokens.dividedBy(Math.pow(10, 18))) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ numberWithCommas(oven.borrowedTokens.dividedBy(Math.pow(10, 18)).toFixed(2)) }} kUSD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ numberWithCommas(oven.stabilityFee.dividedBy(Math.pow(10, 18))) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ numberWithCommas(oven.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)) }} kUSD</strong>
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Popover from "@/components/Popover";

export default {
  name: 'PublicOven',
  props: ['oven'],
  mixins: [Mixins],
  methods: {
    ovenValue(ovenBalance){
      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      return currentValue.dividedBy(Math.pow(10, 2))
    },
    maxBorrowAmt(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let borrowedTokens = this.oven.borrowedTokens.dividedBy(Math.pow(10, 18))

      return valueHalf.minus(borrowedTokens).dividedBy(100)
    },
    collatoralizedRate(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let rate = this.oven.borrowedTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 14))

      return rate.toFixed(2)
    },
  },
  data(){
    return {
    }
  },
  computed: {

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
