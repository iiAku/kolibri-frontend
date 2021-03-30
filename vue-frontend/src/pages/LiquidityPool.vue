<template>
  <div class="liquidity-pool animate__animated animate__fadeIn">
    <portal-target name="project-info-modal" />

    <div :class="{'is-active': warningModalOpen}" class="modal animate__animated animate__fadeIn">
      <div class="modal-background"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Safety Warning</p>
          <button class="delete" aria-label="close"></button>
        </header>
        <section class="modal-card-body">
          <div class="content">
            <h4 class="title">The Kolibri Liquidity Pool is <span class="has-text-danger">ALPHA</span> software.</h4>
            <p>The liquidity pool has <span class="has-text-danger has-text-weight-bold">not</span> been audited for security issues or correctness of operation.</p>
          </div>
        </section>
        <footer class="modal-card-foot is-justify-content-flex-end">
          <button @click="warningModalOpen = !warningModalOpen" class="button is-primary has-text-weight-bold">Acknowledge</button>
        </footer>
      </div>
    </div>

    <div class="columns is-centered">
      <div class="column is-half-desktop is-two-thirds-tablet">
        <div class="box is-paddingless">
          <div class="topper">
            <img class="pool" src="../assets/pool.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Liquidity Pool</h3>
              <button class="button is-outlined is-white">Learn More</button>
            </div>
          </div>

          <nav v-if="$store.lpData !== null && poolBalance !== null" class="level lp-stats">
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Pool Size</p>
                <p class="title">{{ poolBalance.dividedBy(Math.pow(10, 18)).toFixed(2) }} <span class="heading is-inline-block">kUSD</span></p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">Liquidation Reward</p>
                <p class="title">{{ $store.lpData.rewardPercent }}%</p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">LP Tokens Total</p>
                <p class="title">{{ $store.lpData.totalSupply.dividedBy($store.lpMantissa).toFixed(2) }}</p>
              </div>
            </div>
          </nav>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-primary"></div>
          </div>

          <hr>

          <div class="manage-liquidity-pool">
            <div v-if="$store.wallet !== null" class="container holdings is-justify-content-space-around is-flex">

              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium">kUSD Holdings</span>
                <span v-if="$store.walletBalance !== null" class="tag is-medium is-primary">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</span>
                <span v-else class="tag is-medium is-primary">
                  <div class="loader"></div>
                </span>
              </div>
              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-medium">LP Holdings</span>
                <span v-if="$store.lpBalance !== null" class="tag is-medium is-primary">{{ numberWithCommas($store.lpBalance.dividedBy($store.lpMantissa).toFixed(2)) }}</span>
                <span v-else class="tag is-medium is-primary">
                  <div class="loader"></div>
                </span>
              </div>

            </div>
          </div>

          <div class="box">

            <div class="field is-horizontal">
              <div class="field-label is-normal">
                <label class="label">Deposit</label>
              </div>
              <div class="field-body">
                <div class="field has-addons">
                  <p class="control is-expanded">
                    <input v-model="depositInput" class="input" type="number" placeholder="10">
                  </p>
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
                <div class="field has-addons">
                  <p class="control is-expanded">
                    <input v-model="redeemInput" class="input" type="number" placeholder="10">
                  </p>
                  <p class="control">
                    <a class="button is-static has-text-weight-bold">
                      QLkUSD
                    </a>
                  </p>
                </div>
                <div class="field">
                  <div class="control">
                    <button :class="{'is-loading': txPending}" @click="redeemLPTokens" :disabled="!redeemInput || txPending" class="button is-primary has-text-weight-bold">Redeem LP Tokens</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <pre v-text="JSON.stringify($store.lpData, null, 2)"></pre>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Mixins from "@/mixins";
  import BigNumber from "bignumber.js";

  export default {
    name: "LiquidityPool",
    mixins: [Mixins],
    data() {
      return {
        warningModalOpen: false,
        depositInput: '',
        redeemInput: '',
        poolBalance: null,
        txPending: false,
        lpTokenContract: null,
      }
    },
    async mounted(){
      if (!this.$store.isTestnet){
        this.warningModalOpen = true
      }

      this.lpTokenContract = this.$store.isTestnet ? 'KT1X7v7J8sdndX8qudt2n9gASzb4jg3xzXSV' : ''

      if (this.$store.lpData === null){
        const lpContract = await this.$store.tezosToolkit.wallet.at(this.lpTokenContract)
        this.$store.lpData = await lpContract.storage()
        this.$store.lpTokenAddress = this.$store.lpData.tokenAddress
      }

      await this.updatePoolBalance()

    },
    methods: {
      async updatePoolBalance(){
        const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.lpTokenAddress)
        const kUSDStorage = await kUSDContract.storage()
        const poolBalance = await kUSDStorage.balances.get(this.lpTokenContract)
        if (poolBalance === undefined){
          this.poolBalance = new BigNumber(0)
        } else {
          this.poolBalance = poolBalance.balance
        }
      },
      async depositkUSD(){
        this.txPending = true

        try {
          const lpContract = await this.$store.tezosToolkit.wallet.at(this.lpTokenContract)
          const kUSDContract = await this.$store.tezosToolkit.wallet.at(this.$store.lpTokenAddress)

          const sendAmt = new BigNumber(this.depositInput).multipliedBy(Math.pow(10, 18))

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(kUSDContract.methods.approve(this.lpTokenContract, sendAmt))
            .withContractCall(lpContract.methods.deposit(sendAmt))
            .send()

          console.log(sendResult)

          await sendResult.confirmation(1)

          this.depositInput = ''

          this.$eventBus.$emit('refresh-holdings')

          this.poolBalance = null
          await this.updatePoolBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
        }
      },
      async redeemLPTokens(){
        this.txPending = true

        try {
          const lpContract = await this.$store.tezosToolkit.wallet.at(this.lpTokenContract)

          const redeemAmt = new BigNumber(this.redeemInput).multipliedBy(this.$store.lpMantissa)

          const sendResult = await this.$store.tezosToolkit.wallet.batch([])
            .withContractCall(lpContract.methods.redeem(redeemAmt.toFixed(0)))
            .send()

          console.log(sendResult)

          await sendResult.confirmation(1)

          this.redeemInput = ''

          this.$eventBus.$emit('refresh-holdings')

          this.poolBalance = null
          await this.updatePoolBalance()
        } catch(e){
          this.handleWalletError(e, 'Unable To Deposit Liquidity', 'We were unable to deposit kUSD into the LP.')
        } finally {
          this.txPending = false
        }
      }
    },
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
  .liquidity-pool{
    padding-top: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .manage-liquidity-pool{
      .holdings{
        margin-bottom: 1rem;
        & > .title{
          padding: 1rem 2rem;
        }
      }
    }
    .topper{
      display: flex;
      align-items: center;
      justify-content: center;
      background: $primary;
      border-top-left-radius: 5px;
      border-top-right-radius: 5px;
      .pool{
        width: 50%;
        padding: 2rem;
      }
      .words {
        width: 50%;
        padding-left: 1rem;
        color: white;
      }
    }
    .level.lp-stats{
      padding: 1rem 1rem 0;
      margin-top: .5rem;
    }
    .loader-wrapper{
      padding: 1.3rem 1.3rem 0.3rem;
      margin-top: .5rem;
    }
  }
</style>
