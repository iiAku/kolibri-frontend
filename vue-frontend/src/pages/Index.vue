<template>
  <div class="index">
    <section class="cta">
      <div class="columns is-marginless">
        <div class="column cta-column is-6 is-offset-3">
          <div class="columns">
            <div class="column left-column is-6-desktop is-flex is-justify-content-flex-end is-align-items-center is-flex-svg">
              <img class="hummingbird animate__animated animate__fadeIn" src="../assets/hummingbird.svg" />
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

    <div class="animate__animated animate__fadeIn">
      <ovens v-if="$store.wallet !== null" />
      <connect-prompt v-else />
    </div>
  </div>
</template>

<script>
import Stats from "@/components/Stats";
import Ovens from "@/components/Ovens";
import ConnectPrompt from "@/components/ConnectPrompt";

export default {
  name: 'Index',
  async created(){
    
  },
  components: {
    ConnectPrompt,
    Ovens,
    Stats
  },
  methods: {
    getWithExpiry(key) {
      const itemStr = localStorage.getItem(key)
      // if the item doesn't exist, return null
      if (!itemStr) {
        return null
      }
      const item = JSON.parse(itemStr)
      const now = new Date()
      // compare the expiry time of the item with the current time
      if (now.getTime() > item.expiry) {
        // If the item is expired, delete the item from storage
        // and return null
        localStorage.removeItem(key)
        return null
      }
      return item.value
    },
    setWithExpiry(key, value, ttl) {
      const now = new Date()

      // `item` is an object which contains the original value
      // as well as the time when it's supposed to expire
      const item = {
        value: value,
        expiry: now.getTime() + ttl,
      }
      localStorage.setItem(key, JSON.stringify(item))
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .index{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
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
    .hummingbird{
      max-height: 12rem;
      transition: all 250ms ease-out;
      &:hover{
        transform: scale(1.1);
        filter: drop-shadow(0px 5px 5px rgba(0,0,0,0.1));
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
      z-index: 1;
      padding-top: 2rem;
      padding-bottom: 2rem;
      background: linear-gradient(0deg, $light-grey 50%, #FFFFFF 50%);
    }
  }
</style>
