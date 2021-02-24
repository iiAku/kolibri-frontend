<template>
  <section class="all-ovens hero is-fullheight is-align-items-center">
    <div
        v-if="ovensData !== null && $store.priceData !== null"
        class="floating-paginator animate__animated animate__fadeInUp">
      <Pagination
          class="is-centered"
          :itemsTotal="activeVaults.length"
          :itemsPerPage="1"
          :currentPage="currentPage"
          url="AllOvens"
          :buttonsMax="5"
          queryParameter="page"
      />
    </div>
    <div v-if="ovensData === null || $store.priceData === null" class="loading-wrapper">
      <div class="loader is-large is-primary"></div>
    </div>
    <div class="container oven-data is-fluid" v-else>
      <div class="columns is-centered">
        <div class="column is-three-quarters">
          <div class="paginator-widget">
            <div class="is-flex is-justify-content-space-evenly">
              <label class="checkbox">
                <input v-model="hideEmptyOvens" type="checkbox">
                Hide Empty Ovens?
              </label>
              <label class="checkbox">
                <input v-model="hideLiquidatedOvens" type="checkbox">
                Hide Liquidated Ovens?
              </label>
              <label class="checkbox">
                <input v-model="orderByValue" type="checkbox">
                Order Ovens By Value?
              </label>
            </div>
          </div>
        </div>
      </div>
      <public-oven
          :oven="oven"
          :key="oven.ovenAddress"
          @oven-liquidated="markOvenLiquidated"
          v-for="oven in currentChunk"
      />
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import axios from 'axios'
import PublicOven from "@/components/PublicOven";
import Pagination from 'vue-bulma-paginate/src/components/Pagination';
import BigNumber from 'bignumber.js';
import Mixins from '../mixins';

export default {
  name: 'AllOvens',
  mixins: [Mixins],
  async mounted(){
    if (this.$route.query.page){
      this.currentPage = parseInt(this.$route.query.page)
    }

    const response = await axios.get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/oven-data.json`)

    this.ovensData = response.data.allOvenData.map((oven) => {
      let { ovenAddress, ovenOwner, ovenData } = oven

      // Coerce back into bignumbers
      ovenData.balance = new BigNumber(ovenData.balance)
      ovenData.borrowedTokens = new BigNumber(ovenData.borrowedTokens)
      ovenData.stabilityFee = new BigNumber(ovenData.stabilityFee)
      ovenData.outstandingTokens = new BigNumber(ovenData.outstandingTokens)

      // debugger;
      return Object.assign(ovenData, { ovenAddress, ovenOwner })
    })
  },
  data(){
    return {
      ovensData: null,
      ovensDataChunks: null,
      currentPage: 1,
      emptyOvens: {},
      hideEmptyOvens: true,
      hideLiquidatedOvens: true,
      orderByCollateralization: true,
      orderByValue: false,
      modals: {
        newOven: {
          opened: false
        }
      }
    }
  },
  watch: {
    '$route.query.page': function (page) {
      this.currentPage = page
    }
  },
  computed: {
    currentChunk(){
      return this.activeVaults[this.currentPage - 1]
    },
    activeVaults(){
      return _(this.ovensData)
                .reject((oven) => {
                  if (this.hideEmptyOvens) {
                    return oven.balance.isLessThanOrEqualTo(0)
                  }
                  return false
                })
                .reject((oven) => {
                  if (this.hideLiquidatedOvens) {
                    return oven.isLiquidated
                  }
                  return false
                })
                .sortBy((oven) => {
                  if (this.orderByCollateralization){
                    return -1 * parseFloat(this.collatoralizedRateForOven(oven))
                  }
                  return 0
                })
                .sortBy((oven) => {
                  if (this.orderByValue){
                    return oven.balance.times(-1).toNumber()
                  }
                  return 0
                })
                .sortBy((oven) => {
                  if (oven.isLiquidated){
                    return 1
                  }
                  return 0
                })
                .chunk(10)
                .value()
    }
  },
  components: {
    PublicOven,
    Pagination
  },
  methods: {
    markOvenLiquidated(ovenAddress){
      const ovenIndex = _.findIndex(this.ovensData, oven => oven.ovenAddress === ovenAddress)
      this.ovensData[ovenIndex].isLiquidated = true
    },
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .all-ovens{
    background: $light-grey;
    padding-bottom: 3rem;
    .floating-paginator{
      position: fixed;
      bottom: 0;
      z-index: 999;
      background: white;
      padding: .5rem;
      border-top-right-radius: 5px;
      border-top-left-radius: 5px;
    }
    .little-padding{
      padding-bottom: 0.5rem;
    }
    .oven-data{
      padding-top: 0 !important;
    }
    .paginator-widget{
      margin-top: 1.5rem;
      .paginator-list {
        flex-wrap: nowrap;
      }
    }
    &.is-fullheight{
      min-height: calc(100vh - 4rem - 5px);
    }
    .hero-body{
      width: 85vw;
    }
    .loading-wrapper{
      width: 100%;
      height: calc(100vh - 4rem - 5px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container.oven-data{
      @include until($tablet){
        padding: .5rem;
      }
      @include from($desktop){
        padding: 2.5rem 5rem;
      }
    }
  }
</style>
