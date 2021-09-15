<template>
  <div class="box oven pending-oven">
    <div class="oven-info">
      <div class="is-flex is-flex-direction-row is-justify-content-center is-align-items-center">
        <h1 class="title is-marginless is-4">
          This oven is <a target="_blank" rel="noopener" :href="tzktLink(opHash)">being built</a></h1>
        <div class="loader"></div>
      </div>
      <br>
      <p class="heading">{{ opHash }}</p>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";

export default {
  name: 'PendingOven',
  props: ['opHash'],
  mixins: [Mixins],
  async mounted(){

  },
  methods: {

  },
  data(){
    return {

    }
  },
  components: {
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';
  .pending-oven {
    .oven-info{
      text-align: center;
      padding: 2rem;
      .title{
        padding-right: .75rem;
      }
    }
  }
</style>
