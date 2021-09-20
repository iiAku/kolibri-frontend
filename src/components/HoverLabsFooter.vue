<template>
  <footer class="footer hover-footer">
    <div class="content has-text-centered">
      <div class="columns">
        <div class="column">
          <div
            class="hover-logo is-flex is-flex-direction-column"
          >
            <img class="logo" src="../assets/hover-logo.svg" />
            <img class="shadow" src="../assets/shadow.svg" />
          </div>
        </div>
        <div
          class="column links is-flex-direction-column has-text-left is-flex is-justify-content-center"
        >
          <p class="is-marginless">
            Built by the nerds at
            <a target="_blank" rel="noopener" href="https://hover.engineering"
              >Hover Labs</a
            >
          </p>
          <p class="has-text-centered">
            <router-link target="_blank" :to="{ name: 'TOS' }"
              >Terms Of Service</router-link
            >
            |
            <router-link target="_blank" :to="{ name: 'PrivacyPolicy' }"
              >Privacy Policy</router-link
            >
            <br />
            <a
              target="_blank"
              rel="noopener"
              href="https://discord.gg/pCKVNTw6Pf"
            >
              <img
                class="image is-24x24 link-icon"
                style="margin: 10px 15px 0px 0px"
                src="../assets/discord-icon.svg"
              />
            </a>
            <a
              target="_blank"
              rel="noopener"
              href="https://twitter.com/hovereng"
            >
              <img
                class="image is-24x24 link-icon"
                style="margin: 10px 0px 0px 0px"
                src="../assets/twitter-icon.svg"
              />
            </a>
            <a
              target="_blank"
              rel="noopener"
              href="https://kolibri-xtz.medium.com/"
            >
              <img
                class="image is-24x24 link-icon"
                style="margin: 10px 0px 0px 15px"
                src="../assets/medium-icon.svg"
              />
            </a>
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
    return {};
  },
  methods: {},
};
</script>

<style lang="scss" type="text/scss">
@import "../assets/sass/globals";
.hover-footer {
  padding: 3rem;
  .links{
    align-items: flex-start;
    @include until($tablet){
      align-items: center;
    }
  }
  .hover-logo {
    align-items: flex-end;
    @include until($tablet){
      align-items: center;
    }
    img {
      max-width: 12rem;
      max-height: 15rem;
      &.logo {
        animation: hover 2.5s ease-in-out infinite;
        max-width: 8rem;
      }
      &.shadow {
        padding: 0 0.8rem;
        animation: breath 2.5s ease-in-out infinite;
        max-width: 7rem;
        margin-right: 0.5rem;
      }
    }
  }
  .link-icon {
    display: inline-block;
    transform: scale(1);
    transition: all 250ms ease;
    &:hover {
      transform: scale(1.1);
    }
  }
}

@keyframes breath {
  0%,
  100% {
    transform: scale(0.85);
  }
  50% {
    transform: scale(1);
  }
}

@keyframes hover {
  0%,
  100% {
    transform: translateY(-0.5rem);
  }
  50% {
    transform: translateY(0px);
  }
}
</style>
