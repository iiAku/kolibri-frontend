<template>
  <section class="all-ovens hero is-fullheight is-align-items-center">
    <div v-if="ovensData === null || $store.priceData === null" class="loading-wrapper">
      <div class="loader is-large is-primary"></div>
    </div>
    <div class="container oven-data is-fluid" v-else>
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="box paginator-widget">
            <Pagination
                class="is-centered"
                :itemsTotal="activeVaults.length"
                :itemsPerPage="1"
                :currentPage="currentPage"
                url="AllOvens"
                :buttonsMax="5"
                queryParameter="page"
            />
            <label class="checkbox">
              <input v-model="hideEmptyOvens" type="checkbox">
              Hide Empty Ovens?
            </label>
          </div>
        </div>
      </div>
      <public-oven :oven="oven" v-for="oven in currentChunk" :key="oven.ovenAddress" />
    </div>
  </section>
</template>

<script>
import { chunk, filter } from 'lodash'
import axios from 'axios'
import PublicOven from "@/components/PublicOven";
import Pagination from 'vue-bulma-paginate/src/components/Pagination';
import BigNumber from 'bignumber.js';

export default {
  name: 'AllOvens',
  async mounted(){
    if (this.$route.query.page){
      this.currentPage = parseInt(this.$route.query.page)
    }
  
    const response = await axios.get("https://kolibri-data.s3.amazonaws.com/oven-data.json")
    
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
      hideEmptyOvens: false,
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
      let filteredOvens = this.hideEmptyOvens ? filter(this.ovensData, (oven) => oven.balance.toNumber() > 0) : this.ovensData
      return chunk(filteredOvens, 10)
    }
  },
  components: {
    PublicOven,
    Pagination
  },
  methods: {
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .all-ovens{
    background: $light-grey;
    .oven-data{
      padding-top: 0 !important;
    }
    .paginator-widget{
      border-top-left-radius: 0;
      border-top-right-radius: 0;
      padding: 1rem;
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
