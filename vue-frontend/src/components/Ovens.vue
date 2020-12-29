<template>
  <section class="section ovens">
    <oven-manage-modal
        v-if="modal.manage.opened"
        @close-requested="closeManageModal"
        @change-page="modal.manage.requestedPage = $event"
        :current-page="modal.manage.requestedPage"
        :ovenAddress="modal.manage.ovenAddress"
        :opened="modal.manage.opened" />

    <oven-delegate-modal
        v-if="modal.delegate.opened"
        @close-requested="closeDelegateModal"
        :ovenAddress="modal.delegate.ovenAddress"
        :opened="modal.delegate.opened" />

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
                @modal-open-requested="openManageModal"
                @show-delegate-modal="openDeleagateModal"
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
import OvenDelegateModal from "@/components/OvenDelegateModal";

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
        manage: {
          opened: false,
          requestedPage: null,
          ovenAddress: null
        },
        delegate: {
          opened: false,
          ovenAddress: null
        }
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
    openDeleagateModal(ovenAddress){
      this.modal.delegate.opened = true
      this.modal.delegate.ovenAddress = ovenAddress
    },
    openManageModal(page, ovenAddress){
      this.modal.manage.ovenAddress = ovenAddress
      this.modal.manage.requestedPage = page
      this.modal.manage.opened = true
    },
    closeDelegateModal(){
      this.modal.delegate.opened = false
      this.modal.delegate.ovenAddress = null
    },
    closeManageModal(){
      this.modal.manage.opened = false
      this.modal.manage.ovenAddress = null
      this.modal.manage.requestedPage = null
    },
    async createNewOven(){
      try{
        let result = await this.$store.stableCoinClient.deployOven(_.defaultsDeep({}, this.$store.wallet))
        this.$set(this.pendingOvens, result.opHash, true)

        await result.confirmation(1)

        this.$delete(this.pendingOvens, result.opHash)

        const results = await result.operationResults()
        const ovenAddress = results[0].metadata.internal_operation_results[2].result.originated_contracts[0]

        if (this.$store.ownedOvens === null) {
          this.$set(this.$store, 'ownedOvens', {})
        }
        this.$set(this.$store.ownedOvens, ovenAddress, null)
        this.$set(this.$store, 'ovenCount', this.$store.ovenCount + 1)
      } catch(err) {
        this.handleWalletError(err, "Unable To Create Oven", "We were unable to create your Oven!")
      }
    }
  },
  components: {
    OvenDelegateModal,
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
