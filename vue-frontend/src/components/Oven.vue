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
          <p v-if="ovenData && parseInt(ovenData.balance) !== 0" class="level-item"><button :disabled="pendingTransaction" @click="borrow()" class="button is-small is-primary has-text-weight-bold">Create kUSD</button></p>
          <p v-if="ovenData && parseInt(ovenData.borrowedTokens) !== 0" class="level-item"><button :disabled="pendingTransaction" @click="payBack()" class="button is-small is-primary has-text-weight-bold">Pay Back kUSD</button></p>
          <p v-if="ovenData && parseInt(ovenData.balance) !== 0" class="level-item"><button :disabled="pendingTransaction" @click="withdraw()" class="button is-small is-primary has-text-weight-bold">Withdraw ꜩ</button></p>
          <p class="level-item"><button :disabled="pendingTransaction" @click="deposit()" class="button is-small is-primary has-text-weight-bold">Deposit ꜩ</button></p>
        </div>
      </nav>
    </div>

    <div v-if="pendingTransaction" class="loader-wrapper">
      <h1 class="title is-marginless is-5">
        <a v-if="pendingTransaction !== true" target="_blank" rel="noopener" :href="`https://better-call.dev/delphinet/opg/${pendingTransaction}/contents`">Transaction Pending...</a>
        <span v-else>Transaction Pending...</span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else-if="ovenData !== null" class="oven-info">
      <div class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://delphinet.tzkt.io/${ovenData.baker}/delegators`">{{ ovenData.baker }}</a></strong></p>
            <p class="heading">Collateral Utilization: <strong>{{ collatoralizedRate(ovenData.balance) }}%</strong>
              | Can borrow up to
              <popover extra-classes="small-price">
                <strong slot="popup-content" class="has-text-primary heading is-marginless">
                  {{maxBorrowAmt(ovenData.balance)}} kUSD
                </strong>

                <strong class="price-has-popover">{{ maxBorrowAmt(ovenData.balance).toFixed(2) }} kUSD</strong>
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
                <p class="heading">Vault Value (USD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    ${{ ovenValue(ovenData.balance) }} USD
                  </strong>

                  <strong class="price-has-popover">${{ ovenValue(ovenData.balance).toFixed(2) }} USD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (ꜩ)</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong slot="popup-content" class="has-text-primary heading is-marginless">
                      {{ (parseInt(ovenData.balance) / Math.pow(10, 6)) }} ꜩ
                    </strong>

                    <strong class="price-has-popover">{{ (parseInt(ovenData.balance) / Math.pow(10, 6)).toFixed(2) }} ꜩ</strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Balance (KUSD)</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ (parseInt(ovenData.borrowedTokens) / Math.pow(10, 18)) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ (parseInt(ovenData.borrowedTokens) / Math.pow(10, 18)).toFixed(2) }} kUSD</strong>
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div class="is-flex is-flex-direction-column is-align-items-center">
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong slot="popup-content" class="has-text-primary heading is-marginless">
                    {{ (parseInt(ovenData.stabilityFee) / Math.pow(10, 18)) }} kUSD
                  </strong>

                  <strong class="price-has-popover">{{ (parseInt(ovenData.stabilityFee) / Math.pow(10, 18)).toFixed(6) }} kUSD</strong>
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
  },
  methods: {
    ovenValue(ovenBalance){
      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      return currentValue.toNumber() / Math.pow(10, 2)
    },
    maxBorrowAmt(ovenBalance){
      if (parseInt(ovenBalance) === 0) { return 0 }

      let currentValue = this.$store.priceData.price.multipliedBy(ovenBalance).dividedBy(Math.pow(10, 10))
      let valueHalf = currentValue.dividedBy(2)

      let borrowedTokens = this.ovenData.borrowedTokens.dividedBy(Math.pow(10, 18))

      return valueHalf.minus(borrowedTokens).dividedBy(100)
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
        this.ovenClient.getBaker(),
        this.ovenClient.getBalance(),
        this.ovenClient.getBorrowedTokens(),
        this.ovenClient.getStabilityFees(),
        this.ovenClient.getTotalOutstandingTokens(),
      ])

      this.$set(
          this.$store.ownedOvens,
          this.ovenAddress,
          _.zipObject(keys, values)
      )
    },
    async deposit(){
      let count = Number(window.prompt("How many XTZ?"))

      if (count === 0){ return }

      try{
        this.pendingTransaction = true;

        let depositResult = await this.ovenClient.deposit(count * Math.pow(10, 6))

        this.pendingTransaction = depositResult.opHash

        await depositResult.confirmation(1)

        console.log("Deposit Finished! Refreshing data", depositResult)
        await this.updateOvenData()
      } catch(err) {
        this.handleWalletError(err, "Unable to deposit", "We were unable to fulfil your deposit request.")
      } finally {
        this.pendingTransaction = false;
      }
    },
    async withdraw(){
      let count = Number(window.prompt("How many XTZ?"))

      if (count === 0){ return }

      try{
        this.pendingTransaction = true;
        let withdrawResult = await this.ovenClient.withdraw(count * Math.pow(10, 6))

        this.pendingTransaction = withdrawResult.opHash

        await withdrawResult.confirmation(1)

        console.log("Withdraw Finished! Refreshing data", withdrawResult)
        await this.updateOvenData()
      } catch(err) {
        this.handleWalletError(err, "Unable to deposit", "We were unable to fulfil your deposit request.")
      } finally {
        this.pendingTransaction = false;
      }

    },
    async borrow(){
      let count = Number(window.prompt("How many kUSD?"))

      if (count === 0){ return }

      try{
        this.pendingTransaction = true;
        let borrowResult = await this.ovenClient.borrow(count * Math.pow(10, 18))

        this.pendingTransaction = borrowResult.opHash

        await borrowResult.confirmation(1)

        console.log("Borrow Finished! Refreshing data", borrowResult)
        await this.updateOvenData()
      } catch(err) {
        this.handleWalletError(err, "Unable to borrow", "We were unable to fulfil your borrow request.")
      } finally {
        this.pendingTransaction = false;
      }
    },
    async payBack(){
      let count = Number(window.prompt("How many kUSD?"))

      if (count === 0){ return }

      try{
        this.pendingTransaction = true;
        let repayResult = await this.ovenClient.repay(count * Math.pow(10, 18))

        this.pendingTransaction = repayResult.opHash

        await repayResult.confirmation(1)

        console.log("Repay Finished! Refreshing data", repayResult)
        await this.updateOvenData()
      } catch(err) {
        this.handleWalletError(err, "Unable to borrow", "We were unable to fulfil your borrow request.")
      } finally {
        this.pendingTransaction = false;
      }
    },
  },
  data(){
    return {
      pendingTransaction: false,
    }
  },
  computed: {
    ovenData() {
      return this.$store.ownedOvens[this.ovenAddress]
    },
    ovenClient(){
      return this.$store.getOvenClient(this.$store.wallet, this.ovenAddress)
    }
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
  }
</style>
