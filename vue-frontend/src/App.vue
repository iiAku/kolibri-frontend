<template>
  <div>
    <navbar />
    <keep-alive>
      <router-view :key="$route.name"></router-view>
    </keep-alive>
  </div>
</template>

<script>
import Navbar from "@/components/Navbar";
import axios from "axios";
import BigNumber from "bignumber.js";

export default {
  name: 'App',
  components: {
    Navbar
  },
  async mounted(){
    await this.updatePriceInfo()
    await this.updateAllOvenData()
    this.$store.simpleStabilityFee = await this.$store.stableCoinClient.getSimpleStabilityFee()
    this.$store.maxOvenValue = await this.$store.stableCoinClient.getMaximumOvenValue()
    setInterval(this.updatePriceInfo, 60 * 1000) // Go grab oracle data every minute
    setInterval(this.updateAllOvenData, 60 * 1000) // Go grab all oven data every minute
  },
  methods:{
    async updateAllOvenData(){
      const response = await axios.get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/oven-data.json`)

      this.$store.allOvensData = response.data.allOvenData.map((oven) => {
        let { ovenAddress, ovenOwner, ovenData } = oven

        // Coerce back into bignumbers
        ovenData.balance = new BigNumber(ovenData.balance)
        ovenData.borrowedTokens = new BigNumber(ovenData.borrowedTokens)
        ovenData.stabilityFee = new BigNumber(ovenData.stabilityFee)
        ovenData.outstandingTokens = new BigNumber(ovenData.outstandingTokens)

        return Object.assign(ovenData, { ovenAddress, ovenOwner })
      })
    },
    updatePriceInfo(){
      this.$store.harbingerClient.getPriceData()
          .then((priceData) => {
            this.$store.priceData = priceData;
          })
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import './assets/sass/globals';
  @import '~bulma/bulma';
  @import '~animate.css/animate.css';
  @import '~vue-popperjs/dist/vue-popper.css';
  @import '~@sweetalert2/theme-bulma/bulma.scss';
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700&display=fallback');

  // For our modal
  html.disable-scroll {
    overflow: hidden;
  }

  .popper{
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
    text-align: left;
    padding: 1rem;
    text-transform: initial;
    .popper__arrow{
      border-color: transparent transparent #ebebeb transparent !important;
    }
  }
  .swal2-content{
    pre{
      margin-top: 1rem;
    }
  }

  .loader-wrapper{
    padding: 1rem;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .loader{
    &.left-spaced{
      margin-left: 0.5rem;
    }
    &.is-large{
      width: 3rem;
      height: 3rem;
    }
    &.is-medium{
      width: 2rem;
      height: 2rem;
    }
    &.is-primary{
      border: 2px solid $primary;
      border-right-color: transparent;
      border-top-color: transparent;
    }
    &.is-white{
      border: 2px solid $white;
      border-right-color: transparent;
      border-top-color: transparent;
    }
  }

</style>
