<template>
  <nav class="navbar animate__animated animate__fadeIn">
    <div class="navbar-brand">
      <NuxtLink to="/" exact class="navbar-item">
        <img src="~/assets/kolibri-brand.png" />
      </NuxtLink>

      <a @click="menuOpen = !menuOpen" role="button" class="navbar-burger" :class="{ 'is-active': menuOpen }">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{ 'is-active': menuOpen }">
      <div class="navbar-start is-justify-content-center is-flex-grow-1">
        <NuxtLink to="/" exact class="navbar-item">Home</NuxtLink>
        <NuxtLink to="/all-ovens" class="navbar-item">All Ovens</NuxtLink>
        <NuxtLink to="/docs" class="navbar-item">Docs</NuxtLink>
        <template v-if="!LEGACY_PAGES_DISABLED">
          <NuxtLink to="/liquidity-pool" class="navbar-item">Liquidity Pool</NuxtLink>
          <NuxtLink to="/savings-rate" class="navbar-item">Savings Rate</NuxtLink>
          <NuxtLink to="/farming" class="navbar-item">Farming</NuxtLink>
        </template>

        <a :href="govLink()" target="_blank" rel="noopener" class="navbar-item">
          Governance
          <Transition
            enter-active-class="animate__animated animate__fadeIn"
            leave-active-class="animate__animated animate__fadeOut"
          >
            <div v-if="store.daoStorage && store.daoStorage.poll !== null" class="new-badge">
              New Proposal!
            </div>
          </Transition>
        </a>
      </div>

      <div class="navbar-end">
        <div class="navbar-item wallet-connector">
          <div v-if="store.wallet === null" class="buttons">
            <button
              @click="$eventBus.emit('wallet-connect-request')"
              class="button connect-button is-primary is-small"
            >
              <strong>Connect Wallet</strong>
            </button>
          </div>
          <div class="is-flex is-align-items-center" v-else>
            <div class="avatar">
              <div class="image is-48x48" v-html="avatarSvg()"></div>
            </div>
            <div class="wallet-info">
              <p class="has-text-weight-bold has-text-right">
                <a @click="$eventBus.emit('wallet-reconnect-request')">
                  {{ truncateChars(store.walletPKH!, 18) }}
                </a>
              </p>
              <p class="heading has-text-right">
                Network: <strong>{{ store.network }}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Avatars from '@dicebear/avatars'
import sprites from '@dicebear/avatars-bottts-sprites'
import { useKolibriStore } from '~/stores/kolibri'
import { useLinks } from '~/composables/useLinks'
import { useFormatting } from '~/composables/useFormatting'
import { LEGACY_PAGES_DISABLED } from '~/utils/constants'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()
const { govLink } = useLinks()
const { truncateChars } = useFormatting()

const menuOpen = ref(false)
const avatars = new Avatars(sprites, {})

const avatarSvg = () =>
  avatars.create(store.walletPKH!.toString(), {
    width: 48,
    height: 48,
    margin: 4,
  })
</script>

<style lang="scss">
.navbar {
  border-top: 5px solid $primary;
  padding: 0 0.5rem;
  position: relative;
  z-index: 1;
  .new-badge {
    background: $primary;
    position: absolute;
    bottom: 0.2rem;
    padding: 0.1rem 0.25rem;
    font-size: 0.6rem;
    border-radius: 0.5rem;
    color: white;
    right: 0.6rem;
  }
  .wallet-info {
    margin-left: 0.5rem;
  }
  .navbar-start {
    font-weight: bold;
  }
  .navbar-brand {
    @include from($widescreen) {
      min-width: 14.5rem;
    }
  }
  .navbar-item.wallet-connector {
    min-width: 14.5rem;
    justify-content: flex-end;
  }
  .popper.address-full-width {
    padding: 0.5rem 1rem;
  }
}
</style>
