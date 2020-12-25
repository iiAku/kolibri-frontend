<template>
  <section class="section ovens">
    <oven-manage-modal
        @close-requested="closeModal()"
        @change-page="modal.requestedPage = $event"
        :current-page="modal.requestedPage"
        :ovenAddress="modal.ovenAddress"
        :opened="modal.opened" />
    <div class="columns">
      <div class="column is-10 is-offset-1">
        <div v-if="$store.ownedOvens === null" class="loader-wrapper">
          <div class="loader is-primary is-large"></div>
        </div>
        <div v-else class="oven-info">
          <div class="buttons is-centered">
            <button @click="createNewOven" class="button is-primary is-large has-text-weight-bold">Create New Oven</button>
          </div>
          <pending-oven :op-hash="opHash" v-for="(_, opHash) in pendingOvens" :key="opHash" />
          <div v-if="$store.ownedOvens !== null">
            <oven
                @modal-open-requested="openModal"
                :oven-address="oven[0]"
                v-for="oven in sortedOvens"
                :key="oven[0]" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import Oven from "@/components/Oven"
import OvenManageModal from "@/components/OvenManageModal"
import Mixins from '@/mixins'

import _ from 'lodash'
import PendingOven from "@/components/PendingOven";

export default {
  name: 'Ovens',
  mixins: [Mixins],
  async created(){
    let ownedOvens = (await this.$store.stableCoinClient.ovensOwnedByAddress(this.$store.wallet.pkh))
                        .reduce((acc, ovenAddress) => {
                          acc[ovenAddress] = null
                          return acc
                        }, {})

    this.$set(this.$store, 'ownedOvens', ownedOvens)
  },
  data() {
    return {
      pendingOvens: {},
      modal: {
        opened: false,
        requestedPage: null,
        ovenAddress: null
      },
    }
  },
  computed: {
    sortedOvens(){
      return _(this.$store.ownedOvens)
          .toPairs()
          .orderBy(
              (oven) => {
                return oven[1] !== null ? parseInt(oven[1].balance) : 0
              },
              'desc'
          )
          .value()
    }
  },
  methods: {
    closeModal(){
      this.modal.opened = false
      this.modal.ovenAddress = null
      this.modal.requestedPage = null
    },
    openModal(page, ovenAddress){
      this.modal.ovenAddress = ovenAddress
      this.modal.requestedPage = page
      this.modal.opened = true
    },
    async createNewOven(){
      try{
        // {operationHash: "onzNdPPKogumPvkNF9qZjKChxjemqvNcCFMsvmdGY5CC7XH2K4M", ovenAddress: "KT1GXRYR5f5SvBvSBfNmbfxGAqgUwVPwmZLi"}
        let result = await this.$store.stableCoinClient.deployOven(_.defaultsDeep({}, this.$store.wallet))
        this.$set(this.pendingOvens, result.opHash, true)

        await result.confirmation(1)

        this.$delete(this.pendingOvens, result.opHash)

        const results = await result.operationResults()
        const ovenAddress = results[0].metadata.internal_operation_results[2].result.originated_contracts[0]

        if (this.$store.ownedOvens === null) {
          this.$store.ownedOvens = []
        }
        this.$store.ownedOvens.unshift({[ovenAddress]: null})
        this.$set(this.$store, 'ovenCount', this.$store.ovenCount + 1)
      } catch(err) {
        this.handleWalletError(err, "Unable To Create Oven", "We were unable to create your Oven!")
      }
    }
  },
  components: {
    Oven,
    PendingOven,
    OvenManageModal,
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .ovens {
    background: $light-grey;
    padding: 0 1.5rem 2rem;
    .panel-block{
      background: white;
    }
    .panel-heading{
      font-size: 1.5rem;
    }
    .oven-info{

    }
  }
</style>
