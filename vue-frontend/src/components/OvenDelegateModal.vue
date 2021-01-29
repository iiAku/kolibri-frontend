<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div :class="{'is-active': opened}" class="modal modal-component">
      <div @click="close()" class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <h1 class="title">Set Baker</h1>
          <div class="content" v-if="ovenData.baker">
            <strong>Current:</strong>

            <baker-info
                :baker-address="ovenData.baker"
                :valid-baker-address="true"
                :kolibri-baker="kolibriBaker"
                :bakers="bakers"
            />

          </div>
          <div class="content" v-else>
            <strong>Current:</strong>
            <p>You are not currently delegating your funds to any baker. If you want to fund Kolibri (and other tezos-based development) please consider <a @click="bakerAddress = kolibriBaker" class="has-text-weight-bold">delegating your funds to the Kolibri baker</a>.</p>
          </div>
          <div class="content">
            <strong>New Baker:</strong>
            <div class="field">
              <p class="control">
                <input v-model="bakerAddress" class="input" type="text" placeholder="">
              </p>
            </div>

            <baker-info
              :baker-address="bakerAddress"
              :valid-baker-address="validBakerAddress"
              :kolibri-baker="kolibriBaker"
              :bakers="bakers"
            />

            <div class="field is-grouped is-grouped-right">
              <p class="control">
                <button
                    :disabled="!validBakerAddress"
                    @click="setBaker"
                    :class="{'is-loading': networkLoading}"
                    class="button is-success"
                >
                  <strong>Set New Baker</strong>
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
      <button @click="close()" class="modal-close is-large" aria-label="close"></button>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins"
import axios from 'axios'
import _ from 'lodash'
import BakerInfo from "@/components/BakerInfo";
import { CONTRACTS } from "@hover-labs/kolibri-js";

export default {
  name: 'OvenDelegateModal',
  mixins: [Mixins],
  props: {
    opened: {
      type: Boolean
    },
    ovenAddress: {
      type: String
    }
  },
  async created(){
    axios.get('https://api.baking-bad.org/v2/bakers')
        .then((results) => {
          this.bakers = results.data.reduce((acc, baker) => {
            acc[baker.address] = _.omit(baker,'address');
            return acc
          }, {})
        })
  },
  data: function () {
    return {
      bakerAddress: null,
      networkLoading: false,
      bakers: {},
      kolibriBaker: CONTRACTS.DELPHI.KOLIBRI_BAKER
    }
  },
  watch: {
    opened(val){
      if (val) {
        document.documentElement.classList.add('disable-scroll')
      } else {
        document.documentElement.classList.remove('disable-scroll')
      }
    }
  },
  methods: {
    close(){
      this.$emit('close-requested')
      Object.assign(this.$data, this.$options.data())
    },
    async setBaker(){
      try{
        this.networkLoading = true
        let setBakerResult = await this.ovenClient(this.ovenAddress).setBaker(this.bakerAddress)
        this.$eventBus.$emit("tx-submitted", setBakerResult, this.ovenAddress, 'set baker')
        this.close()
      } catch (e) {
        this.handleWalletError(e, "Could not set baker", "There was an issue with the set baker request.")
      } finally {
        this.networkLoading = false
      }
    },
  },
  computed: {
    validBakerAddress(){
      if (this.bakerAddress && this.bakerAddress.length === 36){
        return true
      }
      return false
    },
    ovenData() {
      return this.$store.ownedOvens[this.ovenAddress]
    },
  },
  components: {
    BakerInfo
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.modal-component{
  .new-baker-info{
    margin-bottom: 1rem;
  }
}

</style>
