<template>
  <div class="options">
    <transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
      mode="out-in"
    >
      <div :key="'menu'" v-if="popupOpen" class="menu">

        <button @click="popupOpen = false" class="delete"></button>

        <div class="contracts">
          <h1 class="title is-5 has-text-white is-marginless">Contracts</h1>
          <div class="content">
            <ul class="has-text-white">
              <li :key="contractKey" v-for="(contractName, contractKey) in contracts">
                <b>
                  <a class="has-text-white" target="_blank" rel="noopener" :href="bcdLink($store.NETWORK_CONTRACTS[contractKey])">{{ contractName }}</a>
                </b>
              </li>
            </ul>
          </div>
        </div>

        <nav class="level node-selector">
          <div class="level-item form-label">
            <div class="is-flex is-align-items-center">
              <div v-show="networkLoading" class="loader is-white"></div>
              <p class="has-text-weight-bold has-text-white">RPC Node</p>
            </div>
          </div>
          <div class="level-item">
            <div class="select">
              <select v-model="selectedNode">
                <option
                  :key="nodeName"
                  :value="nodeAddresses[$store.network]"
                  v-for="(nodeAddresses, nodeName) in nodes"
                >
                  {{ nodeName }}
                </option>
                <option v-if="getItem($store.nodeOverrideKey) && !nodesContainsNode(getItem($store.nodeOverrideKey))" :value="getItem($store.nodeOverrideKey)">{{ getItem($store.nodeOverrideKey) }}</option>
                <option value="CUSTOM">
                  Custom
                </option>
              </select>
            </div>
          </div>
        </nav>

        <div class="ipfs-links">
          <p class="has-text-white">This site is continuously deployed to <a target="_blank" rel="noopener" href="https://docs.ipfs.io/concepts/what-is-ipfs/" class="has-text-white has-text-weight-bold">IPFS</a> with the url:</p>
          <pre>ipns://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn</pre>
          <p class="help has-text-white has-text-centered">* Make sure to bookmark it!</p>
          <div class="buttons is-centered">
            <a
              target="_blank"
              rel="noopener"
              href="https://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn.ipns.dweb.link"
              class="button is-outlined is-white"
            >
              <b>dWeb IPFS Site</b>
            </a>
            <a
              target="_blank"
              rel="noopener"
              href="https://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn.ipns.cf-ipfs.com"
              class="button is-outlined is-white"
            >
              <b>Cloudflare IPFS Site</b>
            </a>
          </div>
        </div>
      </div>
      <div :key="'cog'" @click="popupOpen = true" v-else class="options-button is-flex">
        <img src="../assets/cog.svg" />
      </div>
    </transition>
  </div>
</template>

<script>
import axios from "axios";
import Mixins from '../mixins';

export default {
  name: 'Options',
  props: [],
  mixins: [Mixins],
  mounted(){

  },
  computed: {
  },
  methods: {
    getItem(itemKey){
      return localStorage.getItem(itemKey)
    },
    nodesContainsNode(nodeURL){
      const result = Object.values(this.nodes).find((addresses) => {
        return nodeURL === addresses[this.$store.network]
      })

      return result !== undefined
    }
  },
  components: {

  },
  data(){
    let nodes
    if (this.$store.isSandbox) {
      nodes = {
        "Hover Labs' Sandbox": {
          sandboxnet: 'https://sandbox.hover.engineering',
        },
        "127.0.0.1:8732": {
          sandboxnet: 'http://127.0.0.1:8732',
        },
      }
    } else {
      nodes = {
        Giganode: {
          granadanet: 'https://testnet-tezos.giganode.io',
          mainnet: 'https://mainnet-tezos.giganode.io',
        },
        SmartPy: {
          granadanet: 'https://granadanet.smartpy.io',
          mainnet: 'https://mainnet.smartpy.io',
        },
        TZBeta: {
          granadanet: 'https://rpctest.tzbeta.net',
          mainnet: 'https://rpc.tzbeta.net',
        }
      }
    }

    return {
      contracts: {
        MINTER: 'Minter',
        TOKEN: 'kUSD Token',
        OVEN_PROXY: 'Oven Proxy',
        OVEN_FACTORY: 'Oven Factory',
        OVEN_REGISTRY: 'Oven Registry',
        DEVELOPER_FUND: 'Developer Fund',
        STABILITY_FUND: 'Stability Fund',
        ORACLE: 'Oracle',
        LIQUIDITY_POOL: 'Liquidity Pool',
      },
      popupOpen: false,
      selectedNode: this.$store.nodeURL,
      networkLoading: false,
      nodes
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
          localStorage.setItem(this.$store.nodeOverrideKey, result.value)
          location.reload()
        }
      } else {
        this.networkLoading = true
        try {
          await axios.get(newValue + '/chains/main/blocks/head/header')
          localStorage.setItem(this.$store.nodeOverrideKey, newValue)
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
  z-index: 99;
  max-width: 30rem;
  @media screen and (max-width: 30rem){
    max-width: 97%;
  }
  .node-selector{
    border-top: 1px solid white;
    margin-bottom: 0 !important;
    padding: 1rem;
  }
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
  .contracts{
    margin-bottom: 1rem;
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
  .ipfs-links{
    border-top: 1px solid white;
    padding: 1rem;
    pre{
      padding: 0.25rem 0.5rem;
    }
    .buttons{
      margin-top: 1rem;
    }
  }
}
</style>
