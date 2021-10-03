<template>
  <div v-if="show" class="pending-tx-info animate__animated animate__fadeInRight">
    <h4 class="has-text-weight-bold has-text-white is-flex is-align-items-center">Pending Transaction <div class="loader is-white is-inline-block"></div></h4>
    <a target="_blank" rel="noopener" :href="tzktLinkTx(currentTx)" class="has-text-white">{{ truncateChars(currentTx, 20) }}</a>
  </div>
</template>

<script>
export default {
  name: 'PendingTxInfo',
  mounted() {
    this.$eventBus.$on('tx-submitted', (operation) => {
      this.currentTx = operation.opHash
      this.show = true
    })

    this.$eventBus.$on('tx-finished', () => {
      this.currentTx = null
      this.show = false
    })
  },
  data(){
    return {
      show: false,
      currentTx: null
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
    tzktLink(contractOrOp){
      if (this.$store.network === 'granadanet'){
        return `https://granadanet.tzkt.io/${contractOrOp}`
      } else {
        return `https://tzkt.io/${contractOrOp}`
      }
    },
  },
  computed:{
  }
}
</script>

<style lang="scss">
@import '../assets/sass/globals';
.pending-tx-info{
  background: $primary;
  padding: 1rem;
  position: fixed;
  bottom: 0;
  right: 1rem;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  z-index: 100;
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-right: 2px solid white;
  .loader{
    margin-left: .5rem;
  }
}
</style>
