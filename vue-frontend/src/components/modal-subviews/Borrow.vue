<template>
  <div class="borrow">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
                v-on:keyup.enter="shouldAllowBorrow && borrow()"
                v-focus
                type="number"
                min="0"
                v-model.number="borrowAmount"
                class="input"
                placeholder="1.2345" />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold">
              kUSD
            </a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Current Holdings:</strong> <strong class="price-view">{{ numberWithCommas(borrowedTokensFormatted(ovenAddress).toFixed(2)) }} kUSD</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Max Borrow Amount:</strong> <strong class="price-view">
          <a @click="borrowAmount = maxBorrowAmtKUSD(ovenAddress)">
            {{ numberWithCommas(maxBorrowAmtKUSD(ovenAddress).toFixed(2)) }} kUSD
          </a>
        </strong>
      </p>
    </div>
    <div class="field is-horizontal">
      <div class="field-label">
      </div>
      <div class="field-body is-align-items-center">
        <div class="field">
          <p class="control">
            <progress class="progress" :class="collatoralizationWarningClasses(collateralizedRateAfterBorrowing)"  :value="collateralizedRateAfterBorrowing.toFixed(2)" max="100"></progress>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong v-if="borrowAmount && borrowAmount > 0" :class="collatoralizationWarningClasses(collateralizedRateAfterBorrowing)" class="price-view">{{ collateralizedRateAfterBorrowing.toFixed(2) }}%</strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
            @click="borrow()"
            :disabled="!shouldAllowBorrow"
            class="button is-primary has-text-weight-bold"
            :class="{'is-loading': networkLoading}"
        >
          Borrow
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";

export default {
  name: 'Borrow',
  mixins: [Mixins],
  props: {
    ovenAddress: {
      type: String
    }
  },
  data: function () {
    return {
      borrowAmount: null,
      networkLoading: false,
    }
  },
  methods: {
    async borrow(){
      try{
        this.networkLoading = true
        let borrowResult = await this.ovenClient(this.ovenAddress).borrow(this.borrowAmount * Math.pow(10, 18))
        this.$eventBus.$emit("tx-submitted", borrowResult, this.ovenAddress, 'borrow')
        this.$emit('close-requested')
      } catch (e) {
        this.handleWalletError(e, "Unable to borrow", "There was an issue with the borrow request.")
      } finally {
        this.networkLoading = false
      }
    },
  },
  computed: {
    shouldAllowBorrow(){
      if(!this.borrowAmount || this.borrowAmount <= 0) { return false }
      return this.borrowAmount <= this.maxBorrowAmtKUSD(this.ovenAddress).toNumber()
    },
    collateralizedRateAfterBorrowing(){
      let borrowAmount = this.borrowAmount
      if (!borrowAmount || borrowAmount <= 0){
        borrowAmount = 0
      }

      const maxCollateral = this.ovenDollarValue(this.ovenAddress).dividedBy(2)

      const borrowedTokens = this.borrowedTokensFormatted(this.ovenAddress)

      return borrowedTokens.plus(borrowAmount).dividedBy(maxCollateral).times(100)
    }
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../../assets/sass/globals';

.borrow{

}

</style>
