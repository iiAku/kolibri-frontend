<template>
  <div class="savings-rate animate__animated animate__fadeIn">
    <div class="columns is-centered">
      <div class="column is-two-thirds-tablet">
        <div class="box is-paddingless">
          <div class="topper">
            <img class="savings-rate-logo" src="../assets/savings-rate.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Savings Rate</h3>
              <button class="button is-outlined is-white">Learn More</button>
            </div>
          </div>

          <div v-if="savingsRateStorage !== null">
            <nav class="level sr-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Locked kUSD</p>
                  <p class="title">{{ parseFloat(savingsRateStorage.underlyingBalance.dividedBy(1e18).toFixed(2)).toLocaleString() }} <span class="heading is-inline-block">kUSD</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Interest Rate</p>
                  <p class="title">{{ parseFloat(savingsRateStorage.interestRate.toFixed(2)).toLocaleString() }}<span class="heading is-inline-block">%</span></p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">KSR Supply</p>
                  <p class="title">{{ parseFloat(savingsRateStorage.totalSupply.dividedBy($store.lpMantissa).toFixed(2)).toLocaleString() }} <span class="heading is-inline-block">KSR</span></p>
                </div>
              </div>
            </nav>
            <nav class="level sr-stats">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Interest Last Compounded</p>
                  <p class="title is-4">{{ savingsRateStorage.lastInterestCompoundTime }}</p>
                  <p class="help">(~{{ formatMoment(savingsRateStorage.lastInterestCompoundTime) }} ago)</p>
                </div>
              </div>
            </nav>
          </div>
          <div v-else class="loader-wrapper stats-loader">
            <div class="loader is-large is-primary"></div>
          </div>

          <div v-if="$store.wallet !== null" class="manage-liquidity-pool">
            <hr>
            <div class="container holdings is-justify-content-space-around is-flex">

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="$store.walletBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18)).toFixed(18)" class="has-text-white">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">KSR Holdings</span>
                <span v-if="ksrBalance !== null" class="tag is-marginless is-medium is-primary">
                  <a @click="redeemInput = ksrBalance.dividedBy($store.lpMantissa).toFixed(36)" class="has-text-white">{{ numberWithCommas(ksrBalance.dividedBy($store.lpMantissa).toFixed(2)) }} KSR</a>
                </span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader is-white"></div>
                </span>
              </div>

            </div>
          </div>

          <div v-if="$store.wallet !== null" class="management-buttons">
            <hr>
            <div>
              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Deposit</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="depositInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="$store.walletBalance !== null"
                        @click="depositInput = $store.walletBalance.dividedBy(Math.pow(10, 18)).toFixed(18)"
                        class="max-button heading"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        kUSD
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{'is-loading': txPending}" @click="depositkUSD" :disabled="!depositInput || txPending" class="button is-primary has-text-weight-bold">Deposit kUSD</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Redeem</label>
                </div>
                <div class="field-body">
                  <div class="field has-addons input-50">
                    <div class="control is-expanded">
                      <input v-model="redeemInput" class="input" type="number" placeholder="10">
                      <div
                        v-if="ksrBalance !== null"
                        @click="redeemInput = ksrBalance.dividedBy($store.lpMantissa).toFixed(36)"
                        class="max-button heading"
                      >
                        Max
                      </div>
                    </div>
                    <p class="control">
                      <a class="button is-static has-text-weight-bold">
                        KSR
                      </a>
                    </p>
                  </div>
                  <div class="field">
                    <div class="control">
                      <button :class="{'is-loading': txPending}" @click="redeemKSR" :disabled="!redeemInput || txPending" class="button is-primary has-text-weight-bold">Redeem KSR</button>
                    </div>
                  </div>
                </div>
              </div>

              <p class="has-text-centered ksr-value" v-if="ksrBalance !== null">
                Your <b>{{ numberWithCommas(ksrBalance.dividedBy($store.lpMantissa).toFixed(2)) }} KSR</b> is <b>~{{ ksrBalance.dividedBy(savingsRateStorage.underlyingBalance).dividedBy(1e18).times(100).toFixed(2) }}%</b> of the total KSR supply, entitling you to <b>{{ parseFloat(ksrBalance.dividedBy(savingsRateStorage.underlyingBalance).times(savingsRateStorage.underlyingBalance).dividedBy($store.lpMantissa).toFixed(2)).toLocaleString() }} kUSD</b> if you redeem it right now.
              </p>
              <div v-else class="loader-wrapper words-loader">
                <div class="loader"></div>
              </div>

            </div>
          </div>
          <div class="content wallet-connect" v-else>
            <hr>
            <h2 class="has-text-centered">Connect your wallet</h2>
            <p class="has-text-centered">Please connect your wallet to get started!</p>
            <div class="buttons is-centered">
              <button @click="$eventBus.$emit('wallet-connect-request')" class="button is-primary has-text-weight-bold">Connect Wallet</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Mixins from "@/mixins"
  import BigNumber from "bignumber.js"
  import moment from 'moment'

  BigNumber.set({ DECIMAL_PLACES: 36 })

  export default {
    name: "SavingsRate",
    mixins: [Mixins],
    data() {
      return {
        savingsRateStorage: null,
        ksrBalance: null,
        depositInput: '',
        redeemInput: '',
        now: moment(),
        txPending: false,
      }
    },
    async mounted(){
      // TODO: get from kolibri-js
      const contract = await this.$store.tezosToolkit.contract.at('KT1AxX6fFTEaTiRWaW26JPzMDdsTSMB4xskH')
      this.savingsRateStorage = await contract.storage()

      setInterval(() => {
        this.now = moment()
      }, 1000)

      if (this.$store.walletPKH !== null){
        await this.updateKSRBalance()
      } else {
        this.$eventBus.$on('wallet-connected', this.updateKSRBalance)
      }
    },
    methods: {
      formatMoment(time){
        const duration = this.now.diff(moment(time))
        return moment.duration(duration).humanize()
      },
      async updateKSRBalance(){
        let balance = await this.savingsRateStorage.balances.get(this.$store.walletPKH)

        if (balance === undefined){
          balance = new BigNumber(0)
        } else {
          balance = balance.balance
        }

        this.ksrBalance = balance
      },
      async depositkUSD(){
        this.txPending = true

        try {
          const ksrContract = await this.$store.tezosToolkit.wallet.at('KT1AxX6fFTEaTiRWaW26JPzMDdsTSMB4xskH')
          const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.NETWORK_CONTRACTS.TOKEN)

          const sendAmt = new BigNumber(this.depositInput).multipliedBy(Math.pow(10, 18))

          // Prime pool, only needed once
          // await kUSDContract.methods.transfer(this.$store.walletPKH, 'KT1AxX6fFTEaTiRWaW26JPzMDdsTSMB4xskH', 1).send()

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(kUSDContract.methods.approve('KT1AxX6fFTEaTiRWaW26JPzMDdsTSMB4xskH', sendAmt))
            .withContractCall(ksrContract.methods.deposit(sendAmt))
            .send()

          this.$eventBus.$emit('tx-submitted', sendResult)

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.reloadKey += 1

          this.ksrBalance = null
          await this.updateKSRBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
          this.$eventBus.$emit('tx-finished')
          this.depositInput = null
        }
      },
      async redeemKSR(){
        this.txPending = true

        try {
          const KSRContract = await this.$store.tezosToolkit.wallet.at('KT1AxX6fFTEaTiRWaW26JPzMDdsTSMB4xskH')

          const redeemAmt = new BigNumber(this.redeemInput).multipliedBy(this.$store.lpMantissa)

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(KSRContract.methods.redeem(redeemAmt.toFixed(0)))
            .send()

          this.$log(sendResult)

          await sendResult.confirmation(1)

          this.redeemInput = ''

          this.$eventBus.$emit('refresh-holdings')

          this.ksrBalance = null
          await this.updateKSRBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Redeem KSR', 'We were unable to redeem KSR for kUSD.')
        } finally {
          this.txPending = false
        }
      },
    },
    computed: {

    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
  .savings-rate{
    padding-top: 2rem;
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .input-50{
      width: 50%;
    }
    .sr-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .wallet-connect{
      padding-bottom: 2.5rem;
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .savings-rate-logo{
        width: 50%;
        padding: 2rem;
        //max-width: 25vw;
        max-height: 24rem;
      }
      .words {
        width: 35%;
        padding-left: 1rem;
        color: white;
      }
    }

    .control{
      &:hover{
        .max-button{
          opacity: 1;
        }
      }
      input:focus + .max-button{
        opacity: 1;
      }
    }
    .max-button{
      position: absolute;
      top: 0.75rem;
      color: $primary;
      right: .5rem;
      font-weight: bold;
      cursor: pointer;
      border-bottom: 1px solid transparent;
      z-index: 9;
      opacity: 0;
      transition: opacity 250ms linear;
      &:hover{
        border-bottom: 1px solid $primary;
      }
    }

    .ksr-value{
      padding: 1.5rem;
    }
    .words-loader{
      padding: 1.65rem 1rem;
    }
    .stats-loader{
      padding: 4.5rem;
    }

    /* Chrome, Safari, Edge, Opera */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    /* Firefox */
    input[type=number] {
      -moz-appearance: textfield;
    }
  }
</style>
