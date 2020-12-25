<template>
  <div class="stats">
    <nav class="level">
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Active Ovens</p>
          <p v-if="$store.ovenCount === null" class="loader"></p>
          <p v-else class="title">{{ $store.ovenCount }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Stability Fee</p>
          <p v-if="$store.stabilityFee === null" class="loader"></p>
          <p v-else class="title">{{ formattedStabilityFee() }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Collateral Ratio</p>
          <p v-if="$store.collateralRate === null" class="loader"></p>
          <p v-else class="title">{{ formattedCollateralRate() }}%</p>
        </div>
      </div>
    </nav>
    <nav class="level">
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">All Tezos in Kolibri Ovens</p>
          <p v-if="$store.balanceData === null" class="loader"></p>
          <p v-else class="title">{{ numberWithCommas(($store.balanceData.totalBalance / Math.pow(10, 6)).toFixed(2)) }} <span class="subtitle">Ꜩ</span> </p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">All kUSD in Kolibri Ovens</p>
          <p v-if="$store.balanceData === null" class="loader"></p>
          <p v-else class="title">{{ numberWithCommas($store.balanceData.totalTokens.toFixed(2)) }} <span class="subtitle">kUSD</span> </p>
        </div>
      </div>
    </nav>

    <hr>

    <div class="container price-container is-flex is-align-items-center is-justify-content-center">
      <h1 class="subtitle is-marginless has-text-weight-normal">Latest <a href="https://harbinger.live" target="_blank" rel="noopener">XTZ/USD Oracle</a> Price: </h1>
      <div class="price-data">
        <p v-if="$store.priceData === null" class="loader is-small"></p>
        <p v-else class="title is-5 is-marginless">${{ (parseInt($store.priceData.price) / (10 * 100000)).toFixed(2).toLocaleString() }}</p>
      </div>
    </div>
    <p class="heading last-update-time">
      Oracle Last Updated
      <span v-if="$store.priceData === null" class="loader is-small is-inline-block"></span>
      <strong v-else>
        <popover
            v-if="duration($store.priceData.time) > (50 * 60 * 1000)"
        >
          <div slot="popup-title">
            <strong class="has-text-danger">⛔ Warning</strong>
          </div>
          <div slot="popup-content">
            <strong>
              The price oracle has lagged behind longer than 30 minutes, so some we've disabled most contract functionality for safety.
            </strong>
          </div>
          <span class="has-text-danger">⛔️{{ humanTime($store.priceData.time) }} Ago</span>
        </popover>

        <popover
            v-else-if="duration($store.priceData.time) > (25 * 60 * 1000)"
        >
          <div slot="popup-title">
            <strong class="has-text-danger">⚠️ Warning</strong>
          </div>
          <div slot="popup-content">
            <strong>
              The price oracle seems to be lagging behind. If the oracle is more than 30 mins off, some functionality within the ovens is disabled out of an abundance of caution.
            </strong>
          </div>
          <span>⚠️️{{ humanTime($store.priceData.time) }} Ago</span>
        </popover>

        <span v-else>{{ humanTime($store.priceData.time) }} Ago</span>
      </strong>
    </p>
  </div>
</template>

<script>
import moment from "moment"
import BigNumber from "bignumber.js";

import { ConversionUtils } from '@tessellatedgeometry/stablecoin-lib'
import Popover from "@/components/Popover"

import axios from 'axios'

export default {
  name: 'Stats',
  created(){
    console.log("Stats component created")
    setInterval(() => {
      this.now = moment()
    }, 1000)

    this.$store.stableCoinClient.getOvenCount()
        .then((count) => {
          this.$store.ovenCount = count
        })

    axios.get("https://kolibri-data.s3.amazonaws.com/apy.json")
      .then((result) => {
        this.$store.stabilityFee = new BigNumber(result.data.apy)
      })

    axios.get("https://kolibri-data.s3.amazonaws.com/totals.json")
      .then((result) => {
        const { totalBalance, totalTokens } = result.data
        this.$store.balanceData = {
          totalBalance: new BigNumber(totalBalance),
          totalTokens: new BigNumber(totalTokens)
        }
      })

    this.$store.stableCoinClient.getRequiredCollateralizationRatio()
        .then((rate) => {
          this.$store.collateralRate = rate
        })

  },
  components: {
    Popover
  },
  data(){
    return {
      now: moment()
    }
  },
  methods: {
    numberWithCommas(str) {
      return str.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    },
    formattedStabilityFee(){
      return ConversionUtils.shardToHumanReadablePercentage(this.$store.stabilityFee, 4)
    },
    formattedCollateralRate(){
      return this.$store.collateralRate / new BigNumber(Math.pow(10, 18))
    },
    humanTime(time){
      return this.duration(time).humanize()
    },
    duration(time) {
      return moment.duration(this.now - moment(time))
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .stats {
    .loader{
      height: 2rem;
      width: 2rem;
      margin-top: .25rem;
      &.is-small{
        height: 1rem;
        width: 1rem;
      }
    }
    .last-update-time{
      text-align: center;
      margin: 0.5rem 0 0;
      .loader{
        margin-bottom: -4px;
      }
      .popper{
        max-width: 30rem;
        strong, p{
          text-transform: initial;
        }
      }
    }
    .price-container{
      a{
        border-bottom: 1px solid $grey-darker;
        font-weight: bold;
        color: $grey-darker;
        &:hover{
          color: $primary;
          border-bottom: 1px solid $primary;
        }
      }
      .subtitle{
        padding-right: .5rem;
      }
      .price-data{
        min-width: 4.625rem;
      }
    }
  }
</style>
