<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div v-if="opened" :class="{'is-active': opened}" class="modal modal-component">
      <div @click="close()" class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div class="tabs is-centered is-toggle is-fullwidth">
            <ul>
              <li @click="$emit('change-page', 'borrow')" :class="{'is-active': page === 'borrow'}"><a>Borrow kUSD</a></li>
              <li @click="$emit('change-page', 'pay-back')" :class="{'is-active': page === 'pay-back'}"><a>Pay Back kUSD</a></li>
              <li @click="$emit('change-page', 'withdraw')" :class="{'is-active': page === 'withdraw'}"><a>Withdraw ꜩ</a></li>
              <li @click="$emit('change-page', 'deposit')" :class="{'is-active': page === 'deposit'}"><a>Deposit ꜩ</a></li>
            </ul>
          </div>

          <div v-if="page === 'borrow'">
            <div class="title">{{ page }}</div>
          </div>
          <div v-else-if="page === 'pay-back'">
            <div class="title">{{ page }}</div>
          </div>
          <div v-else-if="page === 'deposit'">
            <div class="tabs is-centered is-toggle is-small">
              <ul>
                <li><a>USD</a></li>
                <li><a>Tezos (ꜩ)</a></li>
              </ul>
            </div>
            <div class="title">{{ page }}</div>
          </div>
          <div v-else-if="page === 'withdraw'">
            <div class="title">{{ page }}</div>
          </div>
          <div v-else>
            Error: This page, '{{ page }}' is unknown!
          </div>

        </div>
      </div>
      <button @click="close()" class="modal-close is-large" aria-label="close"></button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    opened: {
      type: Boolean
    },
    page: {
      type: String
    }
  },
  async mounted(){
  },
  data: function () {
    return {

    }
  },
  watch: {
    opened(val){
      if (val) {
        document.documentElement.classList.add('disable-scroll')
      } else {
        document.documentElement.classList.remove('disable-scroll')
      }
    }
  },
  methods: {
    close(){
      this.$emit('close-requested')
    }
  },
  components: {
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.modal-component{
  animation-duration: 250ms;
  animation-timing-function: ease;
}

</style>
