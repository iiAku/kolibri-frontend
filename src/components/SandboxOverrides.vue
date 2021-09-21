<template>
  <transition
      name="custom-classes-transition"
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div>
      <div :class="{'is-active': opened}" class="sandbox-override modal">
        <div @click="opened = false" class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Update Overrides</p>
            <button @click="opened = false" class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <textarea class="textarea" v-model="sandboxOverride" />
          </section>
          <footer class="modal-card-foot buttons is-right">
            <button @click="activateChanges" class="button is-primary">Activate Raw Changes</button>
            <button @click="activateDeployJSON" class="button is-primary">Activate Deploy JSON</button>
            <button @click="opened = false" class="button">Cancel</button>
          </footer>
        </div>
      </div>
      <div class="opener">
        <p>Overriding
          <span v-if="initialSandboxProps && initialSandboxProps !== 'null'">
            {{ initialSandboxProps.match(/[^\\]":/g).length }}
          </span>
          <span v-else>0</span>
          Properties <a class="button is-small is-primary" @click="opened = true">Edit</a></p>

      </div>
    </div>
  </transition>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'SandboxOverride',
  async mounted(){
  },
  methods: {
    activateDeployJSON(){
      const parsedDeployLog = JSON.parse(this.sandboxOverride)
      const overrideMap = {
        MINTER: "kolibri.minterContractDeployResult.contractAddress",
        OVEN_PROXY: "kolibri.ovenProxyDeployResult.contractAddress",
        OVEN_FACTORY: "kolibri.ovenFactoryDeployResult.contractAddress",
        TOKEN: "kolibri.kUSDDeployResult.contractAddress",
        OVEN_REGISTRY: "kolibri.ovenRegistryDeployResult.contractAddress",
        DEVELOPER_FUND: "kolibri.devFundDeployResult.contractAddress",
        STABILITY_FUND: "kolibri.stabilityFundDeployResult.contractAddress",
        ORACLE: "kolibri.oracleDeployResult.contractAddress",
        // HARBINGER_NORMALIZER,
        LIQUIDITY_POOL: "deployed-liquidity-pool.contractAddress",
        QUIPUSWAP_POOL: "deployed-quipuswap-pool.contractAddress",
      }

      let newOverride = {}

      for (let key in overrideMap) {
        const result = _.get(parsedDeployLog, overrideMap[key], null)
        if (result === null){
          alert(`Invalid deploy item ${key} - ${overrideMap[key]}`)
        }
        newOverride[key] = result
      }
      this.sandboxOverride = JSON.stringify({contracts: newOverride}, null, 2)
      localStorage.setItem('sandbox-overrides', this.sandboxOverride)
      location.reload()
    },
    activateChanges(){
      try {
        if (this.sandboxOverride.trim() === '' || this.sandboxOverride === null){
          localStorage.setItem('sandbox-overrides', null)
        } else {
          localStorage.setItem('sandbox-overrides', JSON.stringify(JSON.parse(this.sandboxOverride), null, 2))
        }
        location.reload()
      } catch(e) {
        alert(`Error setting override! ${e.toString()}`)
      }
    }
  },
  computed: {

  },
  data(){
    return {
      opened: false,
      sandboxOverride: localStorage.getItem('sandbox-overrides'),
      initialSandboxProps: localStorage.getItem('sandbox-overrides'),
    }
  }
}
</script>

<style lang="scss">
  @import '../assets/sass/globals';
  .sandbox-override{
    z-index: 99 !important;
    .modal-card{
      height: 90vh;
    }
    textarea{
      height: 100%;
    }
  }
  .opener{
    position: fixed;
    left: 0;
    bottom: 0;
    background: white;
    padding: 1rem 1rem;
    border-top-right-radius: 5px;
    z-index: 98;
    border-top: 2px solid #40bc93;
    border-right: 2px solid #40bc93;
  }
</style>
