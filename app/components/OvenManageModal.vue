<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div
      v-if="opened"
      :class="{ 'is-active': opened }"
      class="modal modal-component"
    >
      <div @click="close()" class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div
            v-if="ovenBalance(ovenAddress).isGreaterThan(0)"
            class="tabs is-centered is-toggle"
          >
            <ul>
              <li
                v-if="ovenBalance(ovenAddress).isGreaterThan(0)"
                @click="emit('change-page', 'Borrow')"
                :class="{ 'is-active': currentPage === 'Borrow' }"
              >
                <a class="has-text-weight-bold is-disabled">Borrow kUSD</a>
              </li>
              <li
                v-if="borrowedTokens(ovenAddress).isGreaterThan(0)"
                @click="emit('change-page', 'Repay')"
                :class="{ 'is-active': currentPage === 'Repay' }"
              >
                <a class="has-text-weight-bold">Pay Back kUSD</a>
              </li>
              <li
                v-if="ovenBalance(ovenAddress).isGreaterThan(0)"
                @click="emit('change-page', 'Withdraw')"
                :class="{ 'is-active': currentPage === 'Withdraw' }"
              >
                <a class="has-text-weight-bold">Withdraw XTZ</a>
              </li>
              <li
                @click="emit('change-page', 'Deposit')"
                :class="{ 'is-active': currentPage === 'Deposit' }"
              >
                <a class="has-text-weight-bold">Deposit XTZ</a>
              </li>
            </ul>
          </div>
          <h1 v-else class="title is-4">Deposit XTZ</h1>
          <component
            @close-requested="close()"
            :ovenAddress="ovenAddress"
            :is="pageComponent"
          />
        </div>
      </div>
      <button
        @click="close()"
        class="modal-close is-large"
        aria-label="close"
      ></button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useOvenCalculations } from '~/composables/useOvenCalculations'
import ModalBorrow from '~/components/modal-subviews/Borrow.vue'
import ModalRepay from '~/components/modal-subviews/Repay.vue'
import ModalDeposit from '~/components/modal-subviews/Deposit.vue'
import ModalWithdraw from '~/components/modal-subviews/Withdraw.vue'

const props = defineProps<{
  opened: boolean
  currentPage: string
  ovenAddress: string
}>()

const emit = defineEmits<{
  'close-requested': []
  'change-page': [page: string]
}>()

const { ovenBalance, borrowedTokens } = useOvenCalculations()

const pageComponents: Record<string, any> = {
  Borrow: ModalBorrow,
  Repay: ModalRepay,
  Deposit: ModalDeposit,
  Withdraw: ModalWithdraw,
}

const pageComponent = computed(() => pageComponents[props.currentPage] ?? ModalDeposit)

watch(() => props.opened, (val) => {
  if (val) {
    document.documentElement.classList.add('disable-scroll')
  } else {
    document.documentElement.classList.remove('disable-scroll')
  }
})

const close = () => {
  emit('close-requested')
}
</script>

<style lang="scss">
.modal-component {
  animation-duration: 250ms;
  animation-timing-function: ease;

  // Remove counter arrows
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  // Remove counter arrows on firefox
  input[type="number"] {
    -moz-appearance: textfield;
  }

  .price-view {
    min-width: 4rem;
    display: inline-block;
    text-align: center;
    &.is-warning {
      color: #dcb000;
    }
    &.is-danger {
      color: $danger;
    }
  }

  .progress {
    height: 0.5rem;
    transition: all 1s linear;
    &::-webkit-progress-value {
      transition: width 0.5s ease;
    }
  }
}
</style>
