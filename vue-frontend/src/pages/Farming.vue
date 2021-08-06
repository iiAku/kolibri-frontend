<template>
  <div class="farming">
    <pending-tx-info />
    <div class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-info">
          Welcome to the Kolibri Farm! Here you can deposit LP tokens (and others) to farm <b><a rel="noopener" target="_blank" href="https://kolibri-xtz.medium.com/announcing-kolibri-dao-6687eb528cb">kDAO governance tokens</a></b>, which let you vote and propose governance actions within the Kolibri protocol!
        </div>
      </div>
    </div>
    <div v-if="!$store.isTestnet && $store.currentBlockHeight !== null" class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div v-if="$store.currentBlockHeight <= 1589248" class="notification is-warning">
          <strong>Please note!</strong><br> Mainnet currently uses 1 min block times, so farms are currently emitting at <strong>50%</strong> of their planned schedule until the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a> goes live. Once live, farm emissions will double from their current drip rate (lasting ~1 year)
        </div>
        <div v-else-if="$store.currentBlockHeight < 1609408" class="notification is-primary">
          With the passing of the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a>, Mainnet has just switched to 30s block times 🥳! The farm rewards are now <strong>doubled</strong> from their previous drip rate thanks to the upgrade!
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
