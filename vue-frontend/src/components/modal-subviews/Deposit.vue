<template>
  <div class="deposit">
    <div class="field is-horizontal">
      <div class="field-label is-normal">
        <label class="label">Amount:</label>
      </div>
      <div class="field-body">
        <div class="field has-addons">
          <p class="control is-expanded">
            <input
                v-on:keyup.enter="shouldAllowDeposit && deposit()"
                v-focus
                type="number"
                min="0"
                v-model.number="depositAmount"
                class="input"
                placeholder="1.2345" />
          </p>
          <p class="control">
            <a class="button is-static has-text-weight-bold">
              ꜩ
            </a>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Oven Collateral: </strong> <strong class="price-view">{{ numberWithCommas(ovenBalanceFormatted(ovenAddress).toFixed(2)) }} ꜩ</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>Collateral Value (USD): </strong> <strong class="price-view">${{ numberWithCommas(ovenDollarValue(ovenAddress).toFixed(2)) }}</strong>
      </p>
    </div>
    <div class="field is-horizontal">
      <div class="field-label">
      </div>
      <div class="field-body is-align-items-center">
        <div class="field">
          <p class="control">
            <progress class="progress" :class="collatoralizationWarningClasses(collateralizedRateAfterDeposit)"  :value="collateralizedRateAfterDeposit.toFixed(2)" max="100"></progress>
          </p>
        </div>
      </div>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>Current Collateral Utilization:</strong>
        <strong class="price-view">{{ currentCollateralRate(ovenAddress).toFixed(2) }}%</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right is-marginless">
      <p class="heading">
        <strong>New Collateral Utilization:</strong>
        <strong v-if="depositAmount" :class="collatoralizationWarningClasses(collateralizedRateAfterDeposit)" class="price-view">{{ collateralizedRateAfterDeposit.toFixed(2) }}%</strong>
        <strong v-else class="price-view"> - </strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="heading">
        <strong>New Collateral Value (USD): </strong>
        <strong v-if="depositAmount" class="price-view">${{ numberWithCommas(ovenDollarValuePlusDeposit(ovenAddress, depositAmount).toFixed(2)) }}</strong>
        <strong v-else class="price-view">-</strong>
      </p>
    </div>
    <div class="field is-grouped is-grouped-right">
      <p class="control">
        <button
            @click="deposit()"
            :disabled="!shouldAllowDeposit"
            class="button is-primary has-text-weight-bold"
            :class="{'is-loading': networkLoading}"
        >
          Deposit
        </button>
      </p>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import BigNumber from 'bignumber.js'

export default {
  name: 'Deposit',
  mixins: [Mixins],
  props: {
    ovenAddress: {
      type: String
    }
  },
  data: function () {
    return {
      depositAmount: null,
      networkLoading: false,
    }
  },
  methods: {
    async deposit(){
      try{
        this.networkLoading = true

        const depositAmtMutez = new BigNumber(this.depositAmount).decimalPlaces(6).multipliedBy(Math.pow(10, 6)).toFixed()

        let depositResult = await this
                                    .ovenClient(this.ovenAddress)
                                    .deposit(depositAmtMutez)
        this.$eventBus.$emit("tx-submitted", depositResult, this.ovenAddress, 'deposit')
        this.$emit('close-requested')
      } catch (e) {
        this.handleWalletError(e, "Unable to deposit", "There was an issue with the deposit request.")
      } finally {
        this.networkLoading = false
      }
    },
  },
  computed: {
    shouldAllowDeposit(){
      return !(!this.depositAmount || this.depositAmount <= 0);
    },
    collateralizedRateAfterDeposit(){
      let depositAmount = this.depositAmount
      if (!depositAmount || depositAmount <= 0){
        depositAmount = 0
      }

      const maxCollateral = this.ovenDollarValuePlusDeposit(this.ovenAddress, depositAmount).dividedBy(2)

      const borrowedTokens = this.borrowedTokensFormatted(this.ovenAddress)

      let collatRate = borrowedTokens.dividedBy(maxCollateral)

      if (!collatRate.isFinite()) {
        collatRate = new BigNumber(0)
      }

      return collatRate.times(100)
    }
  },
}
</script>

<style type="text/scss" lang="scss">
@import '../../assets/sass/globals';

.deposit{

}

</style>
