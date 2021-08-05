<template>
  <div class="options">
    <transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
      mode="out-in"
    >
      <div :key="'menu'" v-if="open" class="menu">

        <button @click="open = false" class="delete"></button>

        <nav class="level">
          <div class="level-item form-label">
            <div class="is-flex is-align-items-center">
              <div v-show="networkLoading" class="loader is-white"></div>
              <p class="has-text-weight-bold has-text-white">RPC Node</p>
            </div>
          </div>
          <div class="level-item">
            <div class="select">
              <select v-model="selectedNode">
                <option :key="nodeName" :value="$store.isTestnet ? nodeAddresses.testnet : nodeAddresses.mainnet" v-for="(nodeAddresses, nodeName) in nodes">
                  {{ nodeName }}
                </option>
                <option v-if="getItem('nodeOverride') && !nodesContainsNode(getItem('nodeOverride'))" :value="getItem('nodeOverride')">{{ getItem('nodeOverride') }}</option>
                <option value="CUSTOM">
                  Custom
                </option>
              </select>
            </div>
          </div>
        </nav>

        <div v-if="!isIPFSLocation && false" class="buttons is-centered">
          <a
            target="_blank"
            rel="noopener"
            href="https://ipfs.io/ipns/k51qzi5uqu5djh7kn7aqel48jmy1zmd8y9faz5jtmcsnrvlcectuo8bu4bhbv0"
            class="button is-small is-outlined is-white"
          >
            <b>Visit IPFS Site</b>
          </a>
        </div>

      </div>
      <div :key="'cog'" @click="open = true" v-else class="options-button is-flex">
        <img src="../assets/cog.svg" />
      </div>
    </transition>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'Options',
  props: [],
  mounted(){

  },
  computed: {
    isIPFSLocation(){
      return window.location.href.includes('k51qzi5uqu5djh7kn7aqel48jmy1zmd8y9faz5jtmcsnrvlcectuo8bu4bhbv0')
    }
  },
  methods: {
    getItem(itemKey){
      return localStorage.getItem(itemKey)
    },
    nodesContainsNode(nodeURL){
      const result = Object.values(this.nodes).find((addresses) => {
        if (this.$store.isTestnet){
          return nodeURL === addresses.testnet
        } else {
          return nodeURL === addresses.mainnet
        }
      })

      return result !== undefined
    }
  },
  components: {

  },
  data(){
    return {
      nodes: {
        Giganode: {
          testnet: 'https://testnet-tezos.giganode.io',
          mainnet: 'https://mainnet-tezos.giganode.io',
        },
        SmartPy: {
          testnet: 'https://florencenet.smartpy.io',
          mainnet: 'https://mainnet.smartpy.io',
        },
        TZBeta: {
          testnet: 'https://rpctest.tzbeta.net',
          mainnet: 'https://rpc.tzbeta.net',
        }
      },
      open: false,
      currentNodeURL: null,
      selectedNode: this.$store.nodeURL,
      networkLoading: false,
    }
  },
  watch: {
    async selectedNode(newValue, oldValue){
      if (newValue === 'CUSTOM'){
        const result = await this.$swal({
          title: 'Please Specify A Node URL',
          input: 'text',
          inputAttributes: {
            autocapitalize: 'off',
            placeholder: "https://some.tezos.node"
          },
          showCancelButton: true,
          confirmButtonText: 'Set Node',
          showLoaderOnConfirm: true,
          preConfirm: async (nodeURL) => {
            nodeURL = nodeURL.replace(/\/+$/, '')

            try {
              new URL(nodeURL)
            } catch(e) {
              await this.$swal.showValidationMessage(e)
              return false
            }

            try {
              await axios.get(nodeURL + '/chains/main/blocks/head/header')
              return nodeURL
            } catch (e) {
              debugger;
              await this.$swal.showValidationMessage(`Request failed: ${e}`)
              return false
            }
          },
          allowOutsideClick: false,
        })

        if (result.isDismissed) {
          this.selectedNode = oldValue
        }

        if (result.isConfirmed){
          localStorage.setItem('nodeOverride', result.value)
          location.reload()
        }
      } else {
        this.networkLoading = true
        try {
          await axios.get(newValue + '/chains/main/blocks/head/header')
          localStorage.setItem('nodeOverride', newValue)
          location.reload()
        } catch(e) {
          //
        } finally {
          this.networkLoading = false
        }
      }
    }
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

@keyframes rotateForever {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.options{
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 40;
  .options-button{
    cursor: pointer;
    border-radius: 50%;
    max-height: 3rem;
    max-width: 3rem;
    padding: 0.4rem;
    margin: 1rem 1.5rem;
    border: 2px solid white;
    background: $primary;
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);

    &:hover{
      img {
        animation: rotateForever 1.5s linear infinite;
      }
    }
  }
  .menu{
    background: $primary;
    position: relative;
    padding: 1rem;
    border-top-left-radius: 5px;
    border-left: 2px solid white;
    border-top: 2px solid white;
    .form-label{
      margin-right: 1rem;
      .loader{
        margin-right: .5rem;
      }
    }
    .delete{
      position: absolute;
      left: -0.55rem;
      top: -0.55rem;
      background: white;
      border: 2px solid $primary;
      &::before, &::after {
        background-color: $primary;
      }
    }
  }
}
</style>
