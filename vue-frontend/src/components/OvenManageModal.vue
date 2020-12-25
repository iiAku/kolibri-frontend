<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn"
      leave-active-class="animate__animated animate__fadeOut"
  >
    <div v-if="opened" :class="{'is-active': opened}" class="modal modal-component">
      <div @click="close()" class="modal-background"></div>
      <div class="modal-content">
        <div class="box">
          <div class="tabs is-centered is-toggle">
            <ul>
              <li
                v-if="ovenBalance(ovenAddress) > 0"
                @click="$emit('change-page', 'Borrow')"
                :class="{'is-active': currentPage === 'Borrow'}"
              >
                <a class="has-text-weight-bold is-disabled">Borrow kUSD</a>
              </li>
              <li
                v-if="borrowedTokens(ovenAddress) > 0"
                @click="$emit('change-page', 'Repay')"
                :class="{'is-active': currentPage === 'Repay'}"
              >
                <a class="has-text-weight-bold">Pay Back kUSD</a>
              </li>
              <li
                v-if="ovenBalance(ovenAddress) > 0"
                @click="$emit('change-page', 'Withdraw')"
                :class="{'is-active': currentPage === 'Withdraw'}"
              >
                <a class="has-text-weight-bold">Withdraw ꜩ</a>
              </li>
              <li
                @click="$emit('change-page', 'Deposit')"
                :class="{'is-active': currentPage === 'Deposit'}"
              >
                <a class="has-text-weight-bold">Deposit ꜩ</a>
              </li>
            </ul>
          </div>

          <component
              @close-requested="close()"
              :ovenAddress="ovenAddress"
              :is="currentPage"
          />

<!--          <div v-else-if="page === 'pay-back'">-->

<!--            <div class="field is-horizontal">-->
<!--              <div class="field-label is-normal">-->
<!--                <label class="label">Amount:</label>-->
<!--              </div>-->
<!--              <div class="field-body">-->
<!--                <div class="field has-addons">-->
<!--                  <p class="control is-expanded">-->
<!--                    <input v-on:keyup.enter="shouldAllowBorrow && borrow()" v-focus type="number" min="0" v-model.number="borrowAmount" class="input" placeholder="1.2345">-->
<!--                  </p>-->
<!--                  <p class="control">-->
<!--                    <a class="button is-static has-text-weight-bold">-->
<!--                      kUSD-->
<!--                    </a>-->
<!--                  </p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right is-marginless">-->
<!--              <p class="heading">-->
<!--                <strong>Current Holdings:</strong> <strong class="price-view">{{ numberWithCommas(borrowedTokensFormatted.toFixed(2)) }} kUSD</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="heading">-->
<!--                <strong>Max Withdraw Amount:</strong> <strong class="price-view">{{ numberWithCommas(maxBorrowAmt.toFixed(2)) }} kUSD</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-horizontal">-->
<!--              <div class="field-label">-->
<!--              </div>-->
<!--              <div class="field-body is-align-items-center">-->
<!--                <div class="field">-->
<!--                  <p class="control">-->
<!--                    <progress class="progress" :class="collatoralizationWarningClasses(collatoralizedRateAfterBorrowing)"  :value="collatoralizedRateAfterBorrowing.toFixed(2)" max="100"></progress>-->
<!--                  </p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="heading">-->
<!--                <strong>New Collatoral Utilization:</strong> <strong :class="collatoralizationWarningClasses(collatoralizedRateAfterBorrowing)" class="price-view">{{ collatoralizedRateAfterBorrowing.toFixed(2) }} %</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="control">-->
<!--                <button-->
<!--                  @click="borrow()"-->
<!--                  :disabled="!shouldAllowBorrow"-->
<!--                  class="button is-primary has-text-weight-bold"-->
<!--                  :class="{'is-loading': networkLoading}"-->
<!--                >-->
<!--                  Borrow-->
<!--                </button>-->
<!--              </p>-->
<!--            </div>-->

<!--          </div>-->
<!--          <div v-else-if="page === 'deposit'">-->
<!--            <div class="field is-horizontal">-->
<!--              <div class="field-label is-normal">-->
<!--                <label class="label">Amount:</label>-->
<!--              </div>-->
<!--              <div class="field-body">-->
<!--                <div class="field has-addons">-->
<!--                  <p class="control is-expanded">-->
<!--                    <input v-on:keyup.enter="depositAmount && depositAmount >= 0 && deposit()" v-focus type="number" min="0" v-model.number="depositAmount" class="input" placeholder="1.2345">-->
<!--                  </p>-->
<!--                  <p class="control">-->
<!--                    <a class="button is-static has-text-weight-bold">-->
<!--                      ꜩ-->
<!--                    </a>-->
<!--                  </p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="control">-->
<!--                <strong>Deposit Value (approx):</strong> <strong class="price-view">{{ xtzToUSD(depositAmount) }}</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="control">-->
<!--                <button-->
<!--                  @click="deposit()"-->
<!--                  :disabled="!depositAmount || depositAmount <= 0"-->
<!--                  class="button is-primary has-text-weight-bold"-->
<!--                  :class="{'is-loading': networkLoading}"-->
<!--                >-->
<!--                  Deposit-->
<!--                </button>-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div v-else-if="page === 'withdraw'">-->
<!--            <div class="field is-horizontal">-->
<!--              <div class="field-label is-normal">-->
<!--                <label class="label">Amount:</label>-->
<!--              </div>-->
<!--              <div class="field-body">-->
<!--                <div class="field has-addons">-->
<!--                  <p class="control is-expanded">-->
<!--                    <input v-on:keyup.enter="withdrawAmount && withdrawAmount >= 0 && withdrawAmount < ovenBalanceFormatted && withdraw()" v-focus type="number" min="0" v-model.number="withdrawAmount" class="input" placeholder="1.2345">-->
<!--                  </p>-->
<!--                  <p class="control">-->
<!--                    <a class="button is-static has-text-weight-bold">-->
<!--                      ꜩ-->
<!--                    </a>-->
<!--                  </p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right is-marginless">-->
<!--              <p class="heading">-->
<!--                <strong>Current Holdings:</strong> <strong class="price-view">{{ numberWithCommas(ovenBalanceFormatted.toFixed(2)) }} ꜩ</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="heading">-->
<!--                <strong>Max Withdraw Amount:</strong> <strong class="price-view">{{ numberWithCommas(maxWithdrawAmt.toFixed(2)) }} ꜩ</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            <div class="field is-horizontal">-->
<!--              <div class="field-label">-->
<!--              </div>-->
<!--              <div class="field-body is-align-items-center">-->
<!--                <div class="field">-->
<!--                  <p class="control">-->
<!--                    <progress class="progress" :class="collatoralizationWarningClasses(collatoralizedRateAfterWithdrawing)"  :value="collatoralizedRateAfterWithdrawing.toFixed(2)" max="100"></progress>-->
<!--                  </p>-->
<!--                </div>-->
<!--              </div>-->
<!--            </div>-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="heading">-->
<!--                <strong>New Collatoral Utilization:</strong> <strong :class="collatoralizationWarningClasses(collatoralizedRateAfterWithdrawing)" class="price-view">{{ collatoralizedRateAfterWithdrawing.toFixed(2) }} %</strong>-->
<!--              </p>-->
<!--            </div>-->
<!--            &lt;!&ndash; <div class="field is-grouped is-grouped-right">-->
<!--              <p class="control">-->
<!--                <strong>Withdraw Value (approx):</strong> <strong class="price-view">{{ xtzToUSD(withdrawAmount) }}</strong>-->
<!--              </p>-->
<!--            </div> &ndash;&gt;-->
<!--            <div class="field is-grouped is-grouped-right">-->
<!--              <p class="control">-->
<!--                <button-->
<!--                  @click="withdraw()"-->
<!--                  :disabled="!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > ovenBalance"-->
<!--                  class="button is-primary has-text-weight-bold"-->
<!--                  :class="{'is-loading': networkLoading}"-->
<!--                >-->
<!--                  Withdraw-->
<!--                </button>-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->
<!--          <div v-else>-->
<!--            Error: This page, '{{ page }}' is unknown!-->
<!--          </div>-->

        </div>
      </div>
      <button @click="close()" class="modal-close is-large" aria-label="close"></button>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins";

import Borrow from '@/components/modal-subviews/Borrow';
import Repay from '@/components/modal-subviews/Repay';
import Deposit from '@/components/modal-subviews/Deposit';
import Withdraw from '@/components/modal-subviews/Withdraw';

import BigNumber from 'bignumber.js'

export default {
  name: 'OvenManageModal',
  mixins: [Mixins],
  props: {
    opened: {
      type: Boolean
    },
    currentPage: {
      type: String
    },
    ovenAddress: {
      type: String
    }
  },
  async mounted(){
  },
  data: function () {
    return {
      depositAmount: null,
      withdrawAmount: null,
      borrowAmount: null,
      repayAmount: null,
      networkLoading: false,
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
      Object.assign(this.$data, this.$options.data())
    },
    xtzToUSD(xtzCount){
      if (!xtzCount || xtzCount <= 0){
        return "-"
      } else {
        let price = this.$store.priceData.price
                          .times(xtzCount)
                          .div(Math.pow(10, 6))
                          .toFixed(2);
        return `$${this.numberWithCommas(price)}`
      }
    },
    numberWithCommas(str) {
      return str.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
    },
    async deposit(){
      try{
        this.networkLoading = true
        let depositResult = await this.ovenClient.deposit(this.depositAmount * Math.pow(10, 6))
        this.$eventBus.$emit("tx-submitted", depositResult, this.ovenAddress, 'deposit')
        this.close()
      } catch (e) {
        this.handleWalletError(e, "Unable not deposit", "There was an issue with the deposit request.")
      } finally {
        this.networkLoading = false
      }
    },
    async withdraw(){
      try{
        this.networkLoading = true
        let withdrawResult = await this.ovenClient.withdraw(this.withdrawAmount * Math.pow(10, 6))
        this.$eventBus.$emit("tx-submitted", withdrawResult, this.ovenAddress, 'withdraw')
        this.close()
      } catch (e) {
        this.handleWalletError(e, "Unable not withdraw", "There was an issue with the withdraw request.")
      } finally {
        this.networkLoading = false
      }
    },

    async repay(){
      try{
        this.networkLoading = true
        let repayResult = await this.ovenClient.repay(this.repayAmount * Math.pow(10, 18))
        this.$eventBus.$emit("tx-submitted", repayResult, this.ovenAddress, 'repay')
        this.close()
      } catch (e) {
        this.handleWalletError(e, "Could not repay", "There was an issue with the repay request.")
      } finally {
        this.networkLoading = false
      }
    },
    collatoralizationWarningClasses(rate){
      if (rate > 100){
        return "is-danger"
      } else if (rate > 90){
        return "is-warning"
      } else {
        return "is-primary"
      }
    },
  },
  computed: {
    maxWithdrawAmt(){
      return this.maxBorrowAmt.dividedBy(this.$store.priceData.price.dividedBy(Math.pow(10, 6)))
    },
    collatoralizedRateAfterBorrowing(){
      if (this.ovenBalance === 0) { return 0 }

      let currentValue = this.$store.priceData.price
                                          .dividedBy(Math.pow(10, 6))
                                          .multipliedBy(this.ovenBalanceFormatted)
      let valueHalf = currentValue.dividedBy(2)

      let borrowAmount = this.borrowAmount
      if (!borrowAmount || borrowAmount < 0){ borrowAmount = "0" }

      let totalTokens = this.borrowedTokens.plus(new BigNumber(borrowAmount).times(Math.pow(10, 18)))

      let rate = totalTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 16))

      return rate
    },
    collatoralizedRateAfterWithdrawing(){
      // if (this.ovenBalance === 0) { return 0 }

      // let currentValue = this.$store.priceData.price
      //                                     .dividedBy(Math.pow(10, 6))
      //                                     .multipliedBy(this.ovenBalanceFormatted - withdrawAmount)

      // let valueHalf = currentValue.dividedBy(2)

      // let withdrawAmount = this.withdrawAmount
      // if (!withdrawAmount || withdrawAmount < 0){ withdrawAmount = "0" }

      // let totalTokens = this.borrowedTokens.plus(new BigNumber(withdrawAmount).times(Math.pow(10, 18)))

      // let rate = totalTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 16))

      return 0
    },
  },
  components: {
    Borrow,
    Repay,
    Withdraw,
    Deposit
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../assets/sass/globals';

.modal-component{
  z-index: 999999;
  animation-duration: 250ms;
  animation-timing-function: ease;

  // Remove counter arrowsshouldAllowBorrow
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  // Remove counter arrows on firefox
  input[type=number] {
    -moz-appearance: textfield;
  }

  .price-view {
    min-width: 4rem;
    display: inline-block;
    text-align: center;
    &.is-warning{
      color: #DCB000;
    }
    &.is-danger{
      color: $danger;
    }
  }

  .progress{
    height: .5rem;
    transition: all 1s linear;
    &::-webkit-progress-value {
      transition: width 0.5s ease;
    }
  }
}

</style>
