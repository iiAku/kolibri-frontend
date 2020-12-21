<template>
  <section class="all-ovens hero is-fullheight is-align-items-center">
    <div v-if="ovensData === null" class="loading-wrapper">
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
            <label v-if="hideEmptyOvens" class="checkbox">
              <input v-model="hideEmptyOvens" type="checkbox">
              Hide Empty Ovens?
            </label>
          </div>
        </div>
      </div>
      <public-oven @is-empty="$set(emptyOvens, oven.ovenAddress, true)" :oven-owner="oven.ovenOwner" :oven-address="oven.ovenAddress" v-for="oven in currentChunk" :key="oven.ovenAddress" />
    </div>
  </section>
</template>

<script>
import _ from 'lodash'
import PublicOven from "@/components/PublicOven";
import Pagination from 'vue-bulma-paginate/src/components/Pagination';

export default {
  name: 'AllOvens',
  async mounted(){
    console.log(this.$route)
    if (this.$route.query.page){
      this.currentPage = parseInt(this.$route.query.page)
    }
    if (this.$route.query.hideEmpty){
      this.hideEmptyOvens = true
    }
    this.ovensData = await this.$store.stableCoinClient.getAllOvens()
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
      const emptyOvens = this.emptyOvens
      return _(this.ovensData)
          .sortBy((oven) => {
            // Deprioritize the unit test owner
            return oven.ovenOwner === "tz1YfB2H1NoZVUq4heHqrVX4oVp99yz8gwNq"
          })
          .filter((oven) => {
            if (this.hideEmptyOvens) {
              console.log("Empty:", emptyOvens)
              if (oven.ovenAddress in emptyOvens){
                return false
              }
            }
            return true
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
