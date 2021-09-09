<template>
  <div>
    <portal-target name="manage-modal" />
    <portal-target name="delegate-modal" />
    <portal-target name="new-oven-modal" />
    <portal-target name="project-info-modal" />

    <pending-tx-info />

    <options />

    <sandbox-override v-if="$store.isSandbox"/>
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
import SandboxOverride from "@/components/SandboxOverrides";
import Options from "@/components/Options";
import PendingTxInfo from "@/components/PendingTransactionInfo";
import _ from 'lodash'

export default {
  name: 'App',
  components: {
    PendingTxInfo,
    Options,
    SandboxOverride,
    Navbar
  },
  data(){
    return {
      updatePriceInfoTimer: null,
      updateAllOvenDataTimer: null,
    }
  },
  async mounted(){
    await this.updateBlockHeight()
    await this.updatePriceInfo()
    await this.updateAllOvenData()
    this.$store.simpleStabilityFee = await this.$store.stableCoinClient.getSimpleStabilityFee()
    this.$store.maxOvenValue = await this.$store.stableCoinClient.getMaximumOvenValue()
    this.updatePriceInfoTimer = setInterval(this.updatePriceInfo, 60 * 1000) // Go grab oracle data every minute
    this.updateAllOvenDataTimer = setInterval(this.updateAllOvenData, 60 * 1000) // Go grab all oven data every minute
  },
  methods:{
    async updateAllOvenData(){
      try {
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
      } catch (e){
        // If we're in the sandbox, just manually resolve these data
        if (this.$store.network === 'sandbox'){
          console.log("Manually resolving ovens...")
          // Clear this if we're manually resolving to show loader
          this.$store.balanceData = null
          this.$store.allOvensData = await this.manuallyResolveOvens()
          this.$store.balanceData = this.manuallyCalculateBalanceData()
        }

        clearInterval(this.updateAllOvenDataTimer)
        console.error(e)
      }
    },
    async manuallyResolveOvens(){
      // If no data exists, fall back on manual resolution/calculation
      const ovens = await this.$store.stableCoinClient.getAllOvens()
      return await Promise.all(
        ovens.map(async (oven) => {
          const ovenClient = this.$store.getOvenClient(this.$store.$wallet, oven.ovenAddress)

          const keys = [
            'baker',
            'balance',
            'borrowedTokens',
            'stabilityFee',
            'isLiquidated'
          ]

          const values = await Promise.all([
            ovenClient.getBaker(),
            ovenClient.getBalance(),
            ovenClient.getBorrowedTokens(),
            ovenClient.getStabilityFees(),
            ovenClient.isLiquidated(),
          ])

          const ovenData = _.zipObject(keys, values)
          ovenData.outstandingTokens = ovenData.borrowedTokens.plus(ovenData.stabilityFee)

          return Object.assign(oven, ovenData)
        })
      )
    },
    manuallyCalculateBalanceData() {
      return {
        totalBalance: _(this.$store.allOvensData).reduce((acc, oven) => {
          return oven.balance.plus(acc)
        }, 0),
        totalTokens: _(this.$store.allOvensData).reduce((acc, oven) => {
          return oven.outstandingTokens.plus(acc)
        }, 0).dividedBy(Math.pow(10, 18))
      }
    },
    updatePriceInfo(){
      this.$store.harbingerClient.getPriceData()
          .then((priceData) => {
            this.$store.priceData = priceData;
          })
    },
    async updateBlockHeight(){
      const currentBlock = await this.$store.tezosToolkit.rpc.getBlock()
      this.$store.currentBlockHeight = currentBlock.header.level
      setTimeout(this.updateBlockHeight, this.$store.network === 'sandbox' ? 4 * 1000 : 10 * 1000)
    },
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
