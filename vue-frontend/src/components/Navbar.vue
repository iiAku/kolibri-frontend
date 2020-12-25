<template>
  <nav class="navbar animate__animated animate__fadeIn">
    <wallet-manager />
    <div class="navbar-brand">
      <a class="navbar-item" href="/">
        <img src="../assets/kolibri-brand.png">
      </a>

      <a @click="menuOpen=!menuOpen" role="button" v-on:clickout="menuOpen=false" class="navbar-burger" :class="{'is-active': menuOpen}">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </a>
    </div>

    <div class="navbar-menu" :class="{'is-active': menuOpen}">
      <div class="navbar-start is-justify-content-center is-flex-grow-1">

        <router-link
            :to="{name: 'Index'}"
            exact
            class="navbar-item"
        >
          Home
        </router-link>

        <router-link
            :to="{name: 'AllOvens'}"
            class="navbar-item"
        >
          All Ovens
        </router-link>

        <router-link
            :to="{name: 'ProjectInfoRoot'}"
            class="navbar-item"
        >
          Project Info
        </router-link>
      </div>

      <div class="navbar-end">
        <div class="navbar-item wallet-connector">
          <div v-if="$store.wallet === null || $store.wallet.connected === false" class="buttons">
            <popover
                class="address-full-width animated slideInRight"
                :disabled="$store.walletAvailable !== false"
            >
              <p slot="popup-content">
                <strong>
                  The <a target='_blank' rel='noopener' href='https://chrome.google.com/webstore/detail/thanos-wallet/ookjlbkiijinhpmnjffcofjonbfbgaoc?hl=en'>Thanos Browser Plugin</a> isn't available! Please install it and try again.
                </strong>
              </p>

              <button
                  :disabled="$store.walletState === WalletStates.CONNECTING || ($store.walletAvailable === false || $store.walletAvailable === null)"
                  :class="{'is-loading': $store.walletState === WalletStates.CONNECTING}"
                  @click="$eventBus.$emit('wallet-connect-request')"
                  class="button connect-button is-primary is-small"
              >
                <strong>Connect Thanos Wallet</strong>
              </button>

            </popover>
          </div>
          <div class="is-flex is-align-items-center" v-else>
            <div class="avatar"><div class="image is-48x48" v-html="avatarSvg()"></div></div>
            <div class="wallet-info">
              <p class="has-text-weight-bold has-text-right">
                {{ truncateChars($store.wallet.pkh, 18) }}
              </p>
              <p class="heading has-text-right">Network: <strong>{{ $store.network }}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import WalletManager from "@/components/WalletManager";
import {WalletStates} from "@/enums";

import Avatars from '@dicebear/avatars';
import sprites from '@dicebear/avatars-bottts-sprites';
import Popover from "@/components/Popover";

let options = {};
let avatars = new Avatars(sprites, options);

export default {
  name: 'Navbar',
  async mounted(){
  },
  data: function () {
    return {
      menuOpen: false,
      WalletStates,
      avatars
    }
  },
  methods: {
    truncateChars(fullStr, strLen, separator) {
      if (fullStr.length <= strLen) return fullStr;

      separator = separator || '...';

      let sepLen = separator.length,
          charsToShow = strLen - sepLen,
          frontChars = Math.ceil(charsToShow/2),
          backChars = Math.floor(charsToShow/2);

      return fullStr.substr(0, frontChars) +
          separator +
          fullStr.substr(fullStr.length - backChars);
    },
    avatarSvg(){
      return avatars.create(this.$store.wallet.pkh.toString(), {
        width: 48,
        height: 48,
        margin: 4,
      })
    }
  },
  components: {
    WalletManager,
    Popover
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.navbar{
  border-top: 5px solid $primary;
  padding: 0 .5rem;
  position: relative;
  z-index: 1;
  .wallet-info{
    margin-left: .5rem;
  }
  .navbar-start{
    font-weight: bold;
  }
  .navbar-brand{
    min-width: 14.5rem;
  }
  .navbar-item.wallet-connector{
    min-width: 14.5rem;
    justify-content: flex-end;
  }
  .popper.address-full-width{
    padding: 0.5rem 1rem;
  }
}

</style>
