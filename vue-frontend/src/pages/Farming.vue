<template>
  <div class="farming">
    <pending-tx-info />
    <div class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-info">
          Welcome to the Kolibri Farm. Here you can deposit LP tokens (and others) to earn <b>kDAO governance tokens</b>, which let you vote and propose governance actions within the Kolibri protocol!
        </div>
      </div>
    </div>
    <div class="columns is-centered is-gapless farms">
      <div class="column is-half-desktop">
        <farm
          v-for="(contract, pairName) in $store.farmContracts"
          :key="pairName"
          :contract="contract"
          :pair-name="pairName"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Farm from "@/components/Farm";
import PendingTxInfo from "@/components/PendingTransactionInfo";

export default {
  name: 'Farming',
  mixins: [Mixins],
  async created(){
    if (this.$store.walletPKH !== null){
      this.$nextTick(this.updatekDAOHoldings)
    } else {
      this.$eventBus.$on('wallet-connected', this.updatekDAOHoldings)
    }
    this.$eventBus.$on('refresh-kdao-holdings', this.updatekDAOHoldings)
  },
  data(){
    return {

    }
  },
  components: {
    PendingTxInfo,
    Farm

  },
  methods: {
    async updatekDAOHoldings(){
      this.$store.kdaoHoldings = null
      const kDAOToken = await this.$store.tezosToolkit.wallet.at(this.$store.daoToken)
      const kDAOStorage = await kDAOToken.storage()
      this.$store.kdaoHoldings = await kDAOStorage.balances.get(this.$store.walletPKH)
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .farming{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
    position: relative;
    z-index: 40;
    .columns{
      &:first-child{
        padding-top: 2.5rem;
      }
      .box{
        background: $primary;
        color: white;
      }
    }
    .farms{
      padding-bottom: 3rem;
    }
  }
</style>
