<template>
  <div>
    <navbar />
    <keep-alive>
      <router-view :key="$route.name"></router-view>
    </keep-alive>
  </div>
</template>

<script>
import Navbar from "@/components/Navbar";

export default {
  name: 'App',
  components: {
    Navbar
  },
  async mounted(){
    await this.updatePriceInfo()
    setInterval(this.updatePriceInfo, 60 * 1000) // Go grab oracle data every minute
  },
  methods:{
    updatePriceInfo(){
      this.$store.harbingerClient.getPriceData()
          .then((priceData) => {
            this.$store.priceData = priceData;
          })
    }
  }
}
</script>

<style type="text/scss" lang="scss">
  @import './assets/sass/globals';
  @import '~bulma/bulma';
  @import '~animate.css/animate.css';
  @import '~vue-popperjs/dist/vue-popper.css';
  @import '~@sweetalert2/theme-bulma/bulma.scss';
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;700&display=fallback');

  // For our modal
  html.disable-scroll {
    overflow: hidden;
  }

  .popper{
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
    text-align: left;
    padding: 1rem;
    text-transform: initial;
    .popper__arrow{
      border-color: transparent transparent #ebebeb transparent !important;
    }
  }
  .swal2-content{
    pre{
      margin-top: 1rem;
    }
  }

  .loader-wrapper{
    padding: 1rem;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .loader{
    &.left-spaced{
      margin-left: 0.5rem;
    }
    &.is-large{
      width: 3rem;
      height: 3rem;
    }
    &.is-medium{
      width: 2rem;
      height: 2rem;
    }
    &.is-primary{
      border: 2px solid $primary;
      border-right-color: transparent;
      border-top-color: transparent;
    }
  }

</style>
