<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div :class="{ 'is-active': opened }" class="modal modal-component">
      <div @click="close()" class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <h2 class="modal-card-title">Set Baker</h2>
        </header>
        <section class="modal-card-body is-paddingless">
          <div class="box">
            <div class="content" v-if="ovenData?.baker">
              <strong>Current:</strong>

              <BakerInfo :baker-address="ovenData.baker" />
            </div>
            <div class="content" v-else>
              <strong>Current:</strong>
              <br />
              You currently don't have a baker set for this Oven.
              <b><a target="_blank" rel="noopener" href="https://www.tessellatedgeometry.com/">Tessellated Geometry</a></b>
              (<b><a @click="bakerAddress = store.NETWORK_CONTRACTS.KOLIBRI_BAKER">{{ truncateChars(store.NETWORK_CONTRACTS.KOLIBRI_BAKER, 18) }}</a></b>)
              is the preferred baker for Kolibri ovens, and a portion of Baking income from oven delegations is used to to support Kolibri's development.
              <br /><br />
              If you'd like a different baker, please set one below. You can always change the baker for your oven at any time in the future, by selecting the baker next to the "DELEGATED BAKER" field in your oven.
            </div>
            <div class="content">
              <strong>New Baker:</strong>
              <BakerSelect v-model="bakerAddress" :default-baker="store.NETWORK_CONTRACTS.KOLIBRI_BAKER" />
            </div>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button
            :disabled="!validBakerAddress(bakerAddress)"
            @click="setBaker"
            :class="{ 'is-loading': networkLoading }"
            class="button is-primary"
          >
            <strong>Set New Baker</strong>
          </button>
        </footer>
      </div>
      <button @click="close()" class="modal-close is-large" aria-label="close"></button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useKolibriStore } from '~/stores/kolibri'
import { useFormatting } from '~/composables/useFormatting'
import { useTransactions } from '~/composables/useTransactions'
import { useWallet } from '~/composables/useWallet'

const props = defineProps<{
  opened: boolean
  ovenAddress: string
}>()

const emit = defineEmits<{
  'close-requested': []
}>()

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { truncateChars } = useFormatting()
const { handleWalletError } = useTransactions()
const { ovenClient, validBakerAddress } = useWallet()

const bakerAddress = ref<string | null>(null)
const networkLoading = ref(false)

const ovenData = computed(() => store.ownedOvens?.[props.ovenAddress] ?? null)

onMounted(() => {
  if (store.ownedOvens?.[props.ovenAddress]?.baker === null) {
    bakerAddress.value = store.NETWORK_CONTRACTS.KOLIBRI_BAKER
  }
})

watch(() => props.opened, (val) => {
  if (val) {
    document.documentElement.classList.add('disable-scroll')
  } else {
    document.documentElement.classList.remove('disable-scroll')
  }
})

const close = () => {
  emit('close-requested')
  bakerAddress.value = null
  networkLoading.value = false
}

const setBaker = async () => {
  try {
    networkLoading.value = true
    const setBakerResult = await ovenClient(props.ovenAddress).setBaker(bakerAddress.value!)
    $eventBus.emit('oven-tx-submitted', { txResult: setBakerResult, ovenAddress: props.ovenAddress, verb: 'set baker' })
    close()
  } catch (e: any) {
    handleWalletError(e, 'Could not set baker', 'There was an issue with the set baker request.')
  } finally {
    networkLoading.value = false
  }
}
</script>

<style lang="scss">
.modal-component {
  .new-baker-info {
    margin-bottom: 1rem;
  }
}
</style>
