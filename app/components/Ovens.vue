<template>
  <section class="section ovens">
    <Teleport to="#manage-modal">
      <OvenManageModal
        v-if="modal.manage.opened"
        @close-requested="closeManageModal"
        @change-page="modal.manage.requestedPage = $event"
        :current-page="modal.manage.requestedPage"
        :oven-address="modal.manage.ovenAddress!"
        :opened="modal.manage.opened"
      />
    </Teleport>

    <Teleport to="#delegate-modal">
      <OvenDelegateModal
        v-if="modal.delegate.opened"
        @close-requested="closeDelegateModal"
        :oven-address="modal.delegate.ovenAddress!"
        :opened="modal.delegate.opened"
      />
    </Teleport>

    <Teleport to="#new-oven-modal">
      <NewOvenModal
        v-if="modal.newOven.opened"
        @close-requested="modal.newOven.opened = false"
      />
    </Teleport>

    <div class="columns">
      <div class="column is-10 is-offset-1">
        <div v-if="store.ownedOvens === null" class="ovens-are-loading loader-wrapper">
          <div class="loader is-primary is-large"></div>
        </div>
        <div v-else class="oven-info">
          <div class="buttons is-centered">
            <button
              @click="modal.newOven.opened = true"
              class="button is-primary is-large has-text-weight-bold"
            >
              Create New Oven
            </button>
          </div>
          <div v-if="store.ownedOvens !== null">
            <Oven
              @modal-open-requested="openManageModal"
              @show-delegate-modal="openDelegateModal"
              :oven-address="oven[0]"
              v-for="oven in sortedOvens"
              :key="oven[0]"
            />
          </div>

          <div class="config-options">
            <div class="control">
              <label class="checkbox">
                <input v-model="hideLiquidatedOvens" type="checkbox" />
                Hide Liquidated Ovens?
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BigNumber from 'bignumber.js'
import { useKolibriStore } from '~/stores/kolibri'
import type { OvenData } from '~/types'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()

const hideLiquidatedOvens = ref(true)

const modal = ref({
  manage: {
    opened: false,
    requestedPage: null as string | null,
    ovenAddress: null as string | null,
  },
  delegate: {
    opened: false,
    ovenAddress: null as string | null,
  },
  newOven: {
    opened: false,
  },
})

const sortedOvens = computed(() => {
  if (!store.ownedOvens) return []

  return Object.entries(store.ownedOvens)
    .filter(([_, ovenData]) => {
      if (hideLiquidatedOvens.value) {
        return !(ovenData && ovenData.isLiquidated)
      }
      return true
    })
    .sort(([, a], [, b]) => {
      const aVal = a?.isLiquidated ? -1 : (a !== null ? parseInt(String(a.balance)) : 0)
      const bVal = b?.isLiquidated ? -1 : (b !== null ? parseInt(String(b.balance)) : 0)
      return bVal - aVal
    })
})

const updateOvens = async () => {
  const ownedOvenAddresses = await store.stableCoinClient.ovensOwnedByAddress(store.walletPKH!)

  // Pre-fetch isLiquidated for each oven so the filter works immediately (no flash)
  const statuses = await Promise.all(
    ownedOvenAddresses.map(async (addr) => {
      try {
        const contract = await store.tezosToolkit.contract.at(addr)
        const storage: any = await contract.storage()
        return { addr, isLiquidated: Boolean(storage.isLiquidated) }
      } catch {
        return { addr, isLiquidated: false }
      }
    }),
  )

  const ownedOvens: Record<string, OvenData | null> = {}
  for (const { addr, isLiquidated } of statuses) {
    if (isLiquidated) {
      ownedOvens[addr] = {
        ovenAddress: addr,
        ovenOwner: store.walletPKH ?? '',
        baker: '',
        balance: new BigNumber(0),
        borrowedTokens: new BigNumber(0),
        stabilityFee: new BigNumber(0),
        outstandingTokens: new BigNumber(0),
        isLiquidated: true,
      }
    } else {
      ownedOvens[addr] = null
    }
  }

  store.ownedOvens = ownedOvens as Record<string, OvenData>

  // In electron land we listen for this event to know to start doing integration stuff
  window.dispatchEvent(new CustomEvent('owned-ovens', { detail: { ownedOvens } }))
}

const openDelegateModal = (ovenAddress: string) => {
  modal.value.delegate.opened = true
  modal.value.delegate.ovenAddress = ovenAddress
}

const openManageModal = (page: string, ovenAddress: string) => {
  modal.value.manage.ovenAddress = ovenAddress
  modal.value.manage.requestedPage = page
  modal.value.manage.opened = true
}

const closeDelegateModal = () => {
  modal.value.delegate.opened = false
  modal.value.delegate.ovenAddress = null
}

const closeManageModal = () => {
  modal.value.manage.opened = false
  modal.value.manage.ovenAddress = null
  modal.value.manage.requestedPage = null
}

onMounted(async () => {
  await updateOvens()

  $eventBus.on('refresh-all-ovens', async () => {
    store.ownedOvens = null
    await updateOvens()
  })
})
</script>

<style lang="scss">
.ovens {
  background: $light-grey;
  padding: 0 1.5rem 2rem;
  .config-options {
    text-align: center;
    padding-top: 3rem;
  }
  .ovens-are-loading {
    padding: 4.25rem;
  }
  .panel-block {
    background: white;
  }
  .panel-heading {
    font-size: 1.5rem;
  }
  .oven-info {
  }
}
</style>
