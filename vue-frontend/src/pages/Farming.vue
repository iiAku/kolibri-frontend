<template>
  <div class="farming">
    <div class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-info">
          Welcome to the Kolibri Farm. Here you can deposit LP tokens (and others) to earn <b>kDAO governance tokens</b>, which let you vote and propose governance actions within the Kolibri protocol!
        </div>
      </div>
    </div>
    <div class="columns is-centered is-gapless">
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

export default {
  name: 'Farming',
  mixins: [Mixins],
  async created(){

  },
  data(){
    return {

    }
  },
  components: {
    Farm

  },
  methods: {

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
  }
</style>
