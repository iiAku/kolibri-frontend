<template>
  <footer class="footer hover-footer">
    <div class="content has-text-centered">
      <div class="columns">
        <div class="column">
          <div class="hover-logo is-flex is-flex-direction-column is-align-items-flex-end">
            <img class="brahman" src="../assets/brahman.svg" />
            <img class="shadow" src="../assets/brahman-shadow.svg" />
          </div>
        </div>
        <div class="column is-flex-direction-column is-align-items-flex-start has-text-left is-flex is-justify-content-center">
          <p class="is-marginless">Built by the nerds at <a target="_blank" rel="noopener" href="https://hover.engineering">Hover Labs</a></p>
          <p>
            <router-link target="_blank" :to="{name: 'TOS'}">Terms Of Service</router-link>
            |
            <router-link target="_blank" :to="{name: 'PrivacyPolicy'}">Privacy Policy</router-link>
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
  export default {
    name: "HoverLabsFooter",
    data() {
      return {

      }
    },
    methods: {},
  }
</script>

<style lang="scss" type="text/scss">
  .hover-footer{
    padding: 3rem;
    .hover-logo{
      img{
        max-width: 7rem;
        max-height: 10rem;
        &.brahman{
          animation: hover 2.5s ease-in-out infinite;
        }
        &.shadow{
          padding: 0 0.8rem;
          animation: breath 2.5s ease-in-out infinite;
        }
      }
    }
  }

  @keyframes breath {
    0%,100% {
      transform: scale(0.85);
    }
    50% {
      transform: scale(1);
    }
  }

  @keyframes hover {
    0%,100% {
      transform: translateY(-.5rem);
    }
    50% {
      transform: translateY(0px);
    }
  }
</style>
