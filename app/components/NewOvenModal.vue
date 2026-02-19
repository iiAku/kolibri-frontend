<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div class="modal modal-component new-oven-modal is-active">
      <div @click="close" class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <h1 class="modal-card-title">Create New Oven</h1>
          <button @click="close" class="delete" aria-label="close"></button>
        </header>
        <section :class="{ 'showing-overlay': sendingTransactions }" class="modal-card-body is-paddingless">
          <div v-if="sendingTransactions" class="summary-overlay">
            <div class="container animate__animated animate__fadeInRight">
              <h1 class="title">Hold tight!<br />We're creating your oven.</h1>
              <div class="step">
                <p class="has-text-primary">
                  1. Creating Oven
                  <template v-if="pendingCreateOvenTx !== null">
                    (<a target="_blank" rel="noopener" :href="tzktLinkTx(pendingCreateOvenTx)" class="has-text-primary">{{ truncateChars(pendingCreateOvenTx, 18) }}</a>)
                  </template>
                </p>
                <div v-if="createdOven"><img class="check" src="~/assets/check.svg" /></div>
                <div v-else class="loader is-primary"></div>
              </div>
              <div
                v-if="selectedDelegate !== store.defaultOvenBaker && selectedDelegate !== null && selectedDelegate !== ''"
                class="step"
              >
                <p
                  :class="{
                    'has-text-grey-light': !createdOven,
                    'has-text-primary': createdOven,
                  }"
                >
                  2. Delegating Oven...
                  <template v-if="pendingSetBakerTx !== null">
                    (<a target="_blank" rel="noopener" :href="tzktLinkTx(pendingSetBakerTx)" class="has-text-primary">{{ truncateChars(pendingSetBakerTx, 18) }}</a>)
                  </template>
                </p>
                <div v-if="createdOven" class="loader is-primary"></div>
              </div>
            </div>
          </div>
          <div v-if="!sendingTransactions" class="submission-form">
            <p>
              You'll need to (optionally) set a baker for your Oven.

              <br />

              <span v-if="store.NETWORK_CONTRACTS.KOLIBRI_BAKER !== null">
                <br />
                <b><a target="_blank" rel="noopener" href="https://www.tessellatedgeometry.com/">Tessellated Geometry</a></b>
                (<b><a @click="selectedDelegate = store.NETWORK_CONTRACTS.KOLIBRI_BAKER">{{ truncateChars(store.NETWORK_CONTRACTS.KOLIBRI_BAKER, 18) }}</a></b>)
                is the preferred baker for Kolibri ovens, and a portion of Baking income from oven delegations is used to to support Kolibri's development. If you'd like a different baker, please set one below.
                <br />
              </span>

              <br />
              You can always change the baker for your oven at any time in the future, by selecting the baker next to the "DELEGATED BAKER" field in your oven.
            </p>
            <hr />

            <BakerSelect v-model="selectedDelegate" :default-baker="store.NETWORK_CONTRACTS.KOLIBRI_BAKER" />
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button @click="close" class="button">Cancel</button>
          <button
            :disabled="sendingTransactions || !validBakerAddress(selectedDelegate)"
            :class="{ 'is-loading': sendingTransactions }"
            @click="createNewOven"
            class="button is-primary"
          >
            Create Oven
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { useLinks } from '~/composables/useLinks'
import { useTransactions } from '~/composables/useTransactions'
import { useWallet } from '~/composables/useWallet'

const emit = defineEmits<{
  'close-requested': []
}>()

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { truncateChars } = useFormatting()
const { tzktLinkTx } = useLinks()
const { handleWalletError } = useTransactions()
const { ovenClient, validBakerAddress } = useWallet()

const selectedDelegate = ref<string | null>(store.NETWORK_CONTRACTS.KOLIBRI_BAKER)
const sendingTransactions = ref(false)
const createdOven = ref(false)
const pendingCreateOvenTx = ref<string | null>(null)
const pendingSetBakerTx = ref<string | null>(null)

const shouldAllowClose = computed(() => !sendingTransactions.value)

const close = () => {
  if (!shouldAllowClose.value) return

  createdOven.value = false
  sendingTransactions.value = false
  pendingCreateOvenTx.value = null
  pendingSetBakerTx.value = null
  emit('close-requested')
}

const createNewOven = async () => {
  try {
    const modalBody = document.querySelector('.modal-card-body')
    if (modalBody) modalBody.scrollTop = 0

    sendingTransactions.value = true

    const walletCopy = JSON.parse(JSON.stringify(store.wallet))

    console.log('Creating oven...')
    let result = await store.stableCoinClient.deployOven(walletCopy)

    pendingCreateOvenTx.value = result.opHash

    console.log('Pending hash -', result.opHash)

    await result.confirmation(1)

    const ovenCreationResults = await result.operationResults()

    const creationResult = ovenCreationResults.find((r: any) => r.kind === 'transaction')

    const ovenAddress = creationResult.metadata.internal_operation_results.find(
      (operation: any) => operation.kind === 'origination',
    ).result.originated_contracts[0]

    createdOven.value = true

    if (store.ownedOvens === null) {
      store.ownedOvens = {}
    }

    store.ownedOvens[ovenAddress] = null as any
    store.ovenCount = (store.ovenCount ?? 0) + 1

    // If we have to set a different delegate, go set a delegate
    if (
      selectedDelegate.value !== store.defaultOvenBaker &&
      selectedDelegate.value !== null &&
      selectedDelegate.value !== ''
    ) {
      result = await ovenClient(ovenAddress).setBaker(selectedDelegate.value)
      $eventBus.emit('oven-tx-submitted', { txResult: result, ovenAddress, verb: 'set baker' })
    }

    createdOven.value = false
    sendingTransactions.value = false
    close()
  } catch (err: any) {
    sendingTransactions.value = false
    handleWalletError(err, 'Unable To Create Oven', 'We were unable to create your Oven!')
  }
}
</script>

<style lang="scss">
.modal-component {
  .submission-form {
    padding: 1.5rem;
  }
  .modal-card-body.showing-overlay {
    overflow: hidden;
  }
  .summary-overlay {
    width: 100%;
    justify-content: center;
    display: flex;
    align-items: center;
    & > .container {
      padding: 3rem;
      .step {
        display: flex;
        align-items: center;
        margin-bottom: 0.25rem;
        a {
          border-bottom: 1px solid $primary;
        }
        .loader,
        .check {
          margin-left: 0.5rem;
        }
        .check {
          max-height: 1rem;
        }
      }
    }
  }
}
</style>
