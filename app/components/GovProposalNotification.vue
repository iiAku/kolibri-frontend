<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div v-if="store.daoStorage && store.daoStorage.poll !== null" class="columns is-centered gov-proposal-notifier">
      <div class="column is-half-desktop">
        <div class="notification is-primary">
          <h1 class="title is-4">Active Governance Proposal</h1>
          <p>
            There is currently an active governance proposal being voted over at the Kolibri
            Governance Portal. If you haven't already done so, please go cast your vote now.
          </p>
          <h1 class="title is-5 proposal-name">
            <a target="_blank" rel="noopener" :href="govLink()">
              Proposal #{{ parseInt(store.daoStorage.poll.id) + 1 }}:
              {{ store.daoStorage.poll.proposal.title }}
            </a>
          </h1>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useKolibriStore } from '~/stores/kolibri'
import { useLinks } from '~/composables/useLinks'

const store = useKolibriStore()
const { govLink } = useLinks()
</script>

<style lang="scss">
.gov-proposal-notifier {
  .notification h1:first-child {
    margin-bottom: 0.5rem;
  }
  .proposal-name {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
}
</style>
