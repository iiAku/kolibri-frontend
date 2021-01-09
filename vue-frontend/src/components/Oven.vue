<template>
  <div class="box oven">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5"><a target="_blank" rel="noopener" :href="`https://better-call.dev/delphinet/${ovenAddress}/`">{{ovenAddress}}</a></h1>
          </div>
        </div>

        <!-- Right side -->
        <div class="level-right">
          <p class="level-item">
            <button
                :disabled="pendingTransaction || updatingData || !(ovenData && parseInt(ovenData.balance) !== 0)"
                @click="$emit('modal-open-requested', 'Borrow', ovenAddress)"
                class="button is-small is-primary has-text-weight-bold"
            >
              Borrow kUSD
            </button>
          </p>
          <p class="level-item">
            <button
                :disabled="pendingTransaction || updatingData || !(ovenData && parseInt(ovenData.borrowedTokens) !== 0)"
                @click="$emit('modal-open-requested', 'Repay', ovenAddress)"
                class="button is-small is-primary has-text-weight-bold"
            >
              Pay Back kUSD
            </button>
          </p>
          <p class="level-item">
            <button
                :disabled="pendingTransaction || updatingData || !(ovenData && parseInt(ovenData.balance) !== 0)"
                @click="$emit('modal-open-requested', 'Withdraw', ovenAddress)"
                class="button is-small is-primary has-text-weight-bold"
            >
              Withdraw ꜩ
            </button>
          </p>
          <p class="level-item">
            <button
                :disabled="pendingTransaction || updatingData || !ovenData"
                @click="$emit('modal-open-requested', 'Deposit', ovenAddress)"
                class="button is-small is-primary has-text-weight-bold"
            >
              Deposit ꜩ
            </button>
          </p>
        </div>
      </nav>
    </div>

    <div v-if="pendingTransaction" class="loader-wrapper">
      <h1 class="title is-marginless is-5">
        <a :title="pendingTransaction" v-if="pendingTransaction !== true" target="_blank" rel="noopener" :href="`https://better-call.dev/delphinet/opg/${pendingTransaction}/contents`">Transaction Pending...</a>
        <span v-else>Transaction Pending...</span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else-if="ovenData !== null && !updatingData" class="oven-info">
      <div class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker:
              <strong v-if="ovenData.baker"><a class="address" @click="$emit('show-delegate-modal', ovenAddress)">{{ ovenData.baker }}</a></strong>

              <popover v-else>
                <div slot="popup-title">
                  <strong class="has-text-danger">⚠️ Warning</strong>
                </div>
                <div slot="popup-content">
                  <strong>
                    This oven is currently <i>not</i> delegated to any baker, and is not
                    <br>
                    receiving staking rewards. Please <a @click="$emit('show-delegate-modal', ovenAddress)">click here</a> to delegate to a baker.
                  </strong>
                </div>
                <strong class="has-text-danger">
                  <a @click="$emit('show-delegate-modal', ovenAddress)">⚠️ Set a baker</a>
                </strong>
              </popover>
            </p>
            <p class="heading">Collateral Utilization: <strong>{{ collatoralizedRate(ovenData.balance) }}%</strong>
              | Can borrow up to
              <popover extra-classes="small-price">
                <strong slot="popup-content" class="has-text-primary heading is-marginless">
                  {{numberWithCommas(maxBorrowAmt(ovenData.balance))}} kUSD
                </strong>

                <strong class="price-has-popover">{{ numberWithCommas(maxBorrowAmt(ovenData.balance).toFixed(2)) }} kUSD</strong>
              </popover>

            <div class="allocation-info is-fullwidth">
              <progress class="progress is-primary" :value="collatoralizedRate(ovenData.balance)" max="100">{{ collatoralizedRate(ovenData.balance) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info is-mobile">
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Collateral Value (USD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    ${{ numberWithCommas(ovenValue(ovenData.balance)) }} USD
                  </strong>

                  <strong class="price-has-popover">${{ numberWithCommas(ovenValue(ovenData.balance).toFixed(2)) }} USD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (ꜩ)</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong slot="popup-content" class="has-text-primary heading is-marginless">
                      {{ numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6))) }} ꜩ
                    </strong>

                    <strong class="price-has-popover">{{ numberWithCommas(ovenData.balance.dividedBy(Math.pow(10, 6)).toFixed(2)) }} ꜩ</strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (KUSD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ numberWithCommas(ovenData.borrowedTokens.dividedBy(Math.pow(10, 18))) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ numberWithCommas(ovenData.borrowedTokens.dividedBy(Math.pow(10, 18)).toFixed(2)) }} kUSD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ numberWithCommas(ovenData.stabilityFee.dividedBy(Math.pow(10, 18))) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ numberWithCommas(ovenData.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)) }} kUSD</strong>
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
    <div v-else class="loader-wrapper">
      <h1 class="title is-marginless is-5">Loading Oven Data...</h1><div class="loader left-spaced"></div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Mixins from "@/mixins";
import Popover from "@/components/Popover";

export default {
  name: 'Oven',
  props: ['ovenAddress'],
  mixins: [Mixins],
  async created(){
    await this.updateOvenData()

    this.$eventBus.$on("tx-submitted", (txResult, ovenAddress, verb) => {
      if (this.ovenAddress === ovenAddress){
        this.waitForTxAndRefresh(txResult, verb)
      }
    })
  },
  methods: {
    ovenValue(ovenBalance){
      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      return currentValue.dividedBy(Math.pow(10, 2))
    },
    maxBorrowAmt(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.dividedBy(Math.pow(10, 6))
                                .multipliedBy(ovenBalance.dividedBy(Math.pow(10, 6)))

      let valueHalf = currentValue.dividedBy(2)

      let borrowedTokens = this.ovenData.borrowedTokens.dividedBy(Math.pow(10, 18))

      return valueHalf.minus(borrowedTokens)
    },
    collatoralizedRate(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let rate = this.ovenData.borrowedTokens.dividedBy(valueHalf).dividedBy(Math.pow(10, 14))

      return rate.toFixed(2)
    },
    async updateOvenData(){
      const keys = ['baker', 'balance', 'borrowedTokens', 'stabilityFee', 'outstandingTokens']

      const values = await Promise.all([
        this.ovenClient(this.ovenAddress).getBaker(),
        this.ovenClient(this.ovenAddress).getBalance(),
        this.$store.tokenClient.getBalance(this.$store.wallet.pkh),
        this.ovenClient(this.ovenAddress).getStabilityFees(),
        this.ovenClient(this.ovenAddress).getTotalOutstandingTokens(),
      ])

      this.$set(
          this.$store.ownedOvens,
          this.ovenAddress,
          _.zipObject(keys, values)
      )
    },
    async waitForTxAndRefresh(txResult, verb){
      try{
        this.pendingTransaction = txResult.opHash
        await txResult.confirmation(1)
        this.updatingData = true
        this.pendingTransaction = false
        console.log("Deposit Finished! Refreshing data", txResult)
        await this.updateOvenData()
        this.updatingData = false
      } catch(err) {
        this.handleWalletError(err, `Unable to ${verb}`, `We were unable to fulfil your ${verb} request.`)
      } finally {
        this.pendingTransaction = false;
      }
    },
    async withdraw(){
      this.$emit('modal-open-requested', 'withdraw', this.ovenAddress)
    },
    async payBack(){
      this.$emit('modal-open-requested', 'pay-back', this.ovenAddress)
    },
  },
  data(){
    return {
      pendingTransaction: false,
      updatingData: false,
    }
  },
  computed: {
    ovenData() {
      return this.$store.ownedOvens[this.ovenAddress]
    },
  },
  components: {
    Popover,
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .oven {
    padding: 0;
    width: 100%;
    .address{
      text-transform: initial;
    }
    .oven-info{
      .columns{
        @include until($widescreen){
          flex-direction: column;
        }
      }
    }
    .loader-wrapper{
        padding: 1.75rem;
    }
    .popper.small-price{
      padding: .5rem;
      font-weight: bold;
    }
    .price-has-popover{
      cursor: pointer;
      border-bottom: 1px solid $primary;
    }
    .pending-tx{
      .heading{
        margin-right: .5rem;
        margin-bottom: 0;
      }
    }
    .top{
      padding: 1rem;
      border-bottom: 2px solid $light-grey;

      .popper{
        padding: .5rem;
      }
      .level{
        @include until($widescreen){
          flex-direction: column;
          .level-left{
            margin-bottom: .75rem;
          }
        }
      }
    }
    .right-info{
      margin: 1rem 0;
      @include until($desktop){
        padding-bottom: 1rem;
      }
    }
    .left-info{
      width: 100%;
      padding: .75rem 1.5rem;
      progress{
        height: .75rem;
      }
    }
    .tx-hash{
      font-size: .5rem;
    }
  }
</style>
