<template>
  <div class="index">
    <portal-target name="manage-modal" />
    <portal-target name="delegate-modal" />

    <div v-if="!this.$store.isTestnet && this.$store.maxOvenValue !== null && showWarning" class="prerelease-warning is-flex is-justify-content-center">
      <div class="notification is-warning">
        <button @click="showWarning = false" class="delete"></button>
        <b>Please Note:</b> The Kolibri project code is undergoing a security audit. Until the audit is complete, there is a <b>100 XTZ</b> oven maximum. Please use Kolibri at your own risk. Refer to our
        <router-link
            rel="noopener"
            target="_blank"
            :to="{
              name: 'ProjectInfo',
              params: { folder: 'security', page: 'security-audit' },
            }"
        >
          audit report status page
        </router-link>
        for more details.
      </div>
    </div>

    <section class="cta">
      <div class="columns is-marginless">
        <div class="column cta-column is-6 is-offset-3">
          <div class="columns">
            <div class="column left-column is-6-desktop is-flex is-justify-content-flex-end is-align-items-center is-flex-svg">
              <transition
                  enter-active-class="animate__animated animate__fadeIn animate__faster"
                  leave-active-class="animate__animated animate__fadeOut animate__faster"
                  mode="out-in"
              >
                <img @click="clickCount += 1" v-if='clickCount < 5' class="hummingbird" src="../assets/hummingbird.svg" />
                <div v-else class="hummingbird-pixel-wrapper">
                  <img class="hummingbird hummingbird-pixel" src="../assets/hummingbird-2.png" />
                </div>
              </transition>

            </div>
            <div class="column is-6 is-12-mobile is-flex is-justify-content-center is-flex-direction-column animate__animated animate__fadeIn animate">
              <h1 class="title has-text-weight-bold is-huge">Kolibri</h1>
              <h2 class="subtitle has-text-weight-light is-huge">Stablecoin</h2>
              <div>
                <router-link :to="{name: 'ProjectInfoRoot'}" class="button is-primary is-outlined has-text-weight-bold">Learn More</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="info-section animate__animated animate__fadeIn">
      <div class="container">
        <div class="columns is-marginless is-centered">
          <div class="column is-half-widescreen is-three-quarters-desktop">
            <div class="box">

              <stats />

            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="animate__animated animate__fadeIn ovens-wrapper">
      <ovens v-if="$store.wallet !== null" />
      <connect-prompt v-else />
    </div>

    <hover-labs-footer />
  </div>
</template>

<script>
import Stats from "@/components/Stats";
import Ovens from "@/components/Ovens";
import ConnectPrompt from "@/components/ConnectPrompt";
import HoverLabsFooter from "@/components/HoverLabsFooter";

export default {
  name: 'Index',
  async created(){
    this.$store.simpleStabilityFee = await this.$store.stableCoinClient.getSimpleStabilityFee()
    this.$store.maxOvenValue = await this.$store.stableCoinClient.getMaximumOvenValue()
  },
  data(){
    return {
      clickCount: 0,
      showWarning: true
    }
  },
  components: {
    ConnectPrompt,
    Ovens,
    Stats,
    HoverLabsFooter
  },
  methods: {

  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .index{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
    position: relative;
    z-index: 40;
    .prerelease-warning{
      background: white;
      padding: 1rem;
      margin: 0;
      .notification{
        max-width: 75vw;
      }
    }
    .ovens-wrapper{
      position: relative;
      z-index: 1;
      padding-bottom: 1.5rem;
    }
    .navbar{
      border-top: 5px solid $primary;
      padding: 0 .5rem;
      .navbar-start{
        font-weight: bold;
      }
    }
    .navbar-brand{
      padding-right: 4.75rem; // Margin to center the navbar-start/middle stuff
    }
    .hummingbird-pixel-wrapper{
      width: 190px;
      height: 192px;
      transition: all 250ms ease-out;
      text-align: center;
      &:hover{
        filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.1));
      }
    }
    .hummingbird{
      max-height: 12rem;
      transition: all 250ms ease-out;
      &:hover{
        transform: scale(1.1);
        filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.1));
      }
      &.hummingbird-pixel{
        transform: rotate(11deg) scale(1.1);
        &:hover{
          transform: rotate(11deg) scale(1.2);
        }
      }
    }
    h1.is-huge{
      font-size: 4.25rem;
      margin-bottom: .5rem;
    }
    h2.is-huge{
      font-size: 3rem;
      margin-bottom: .5rem;
    }
    .cta{
      padding-top: 2rem;
      background: white;
      .cta-column{
        .is-flex-svg{
          flex: 1 1 auto;
        }
        @include until($desktop){
          width: 80vw;
          margin: auto;
        }
        @include until($tablet){
          width: 100vw;
          margin: auto;
          & > .columns{
            display: flex;
            flex-direction: column;
            align-items: center;
            .column{
              text-align: center;
            }
          }
        }
      }
    }
    .info-section{
      position: relative;
      z-index: 2;
      padding-top: 2rem;
      padding-bottom: 2rem;
      background: linear-gradient(0deg, $light-grey 50%, #FFFFFF 50%);
    }
  }
</style>
