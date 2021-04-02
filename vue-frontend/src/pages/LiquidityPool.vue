<template>
  <div class="liquidity-pool animate__animated animate__fadeIn">
    <portal-target name="project-info-modal" />

    <transition
      name="custom-classes-transition"
      enter-active-class="animate__fadeIn"
      leave-active-class="animate__fadeOut"
    >
      <div v-if="warningModalOpen" :class="{'is-active': warningModalOpen}" class="modal animate__animated animate__fast">
        <div class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Safety Warning</p>
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
    </transition>

    <transition
      name="custom-classes-transition"
      enter-active-class="animate__fadeIn"
      leave-active-class="animate__fadeOut"
    >
      <div v-if="learnMoreModalOpen" :class="{'is-active': learnMoreModalOpen}" class="modal animate__animated animate__fast">
        <div @click="learnMoreModalOpen = !learnMoreModalOpen" class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Kolibri Liquidation Pool</p>
            <button @click="learnMoreModalOpen = !learnMoreModalOpen" class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <div class="content">
              <p>A <b>Liquidation Pool</b> is a shared pool where users contribute funds in order to liquidate under-collateralized ovens.</p>
              <p>Users deposit <b>kUSD tokens</b> in the pool and receive <b>QLkUSD</b> (<b>Q</b>uipuswap <b>L</b>iquidating <b>kUSD</b>) tokens in return. The QLkUSD tokens entitle the holder to the original amount of kUSD tokens deposited, plus any additional kUSD tokens earned from liquidating ovens. QLkUSD tokens are liquid and may be sent to other users or used in other applications. Any user who holds a QLkUSD may return the token to the pool and receive the associated kUSD at any time. </p>

              <h3 class="title">How It Works</h3>
              <p>The pool contains kUSD from many users who have pledged their kUSD to liquidate ovens on Kolibri. When an oven is undercollateralized, anyone may liquidate it, provided they have sufficient kUSD to repay the loan. When an oven is liquidated, the liquidator receives the collateral (XTZ) in the oven.</p>
              <p>Any user can act as a <b>liquidator</b> and can initiate a transaction that will use the pooled kUSD to liquidate an oven. When an oven is liquidated, the pool receives XTZ, which should be worth more than the kUSD repaid.</p>
              <p>The pool also pays a percentage of the received XTZ directly to the liquidator. This payment reimburses the liquidator for their transaction fees, and it rewards the liquidator for using the pool, rather than selfishly liquidating the oven themselves.</p>
              <p>The pool then trades the remaining XTZ for kUSD on <a target="_blank" rel="noopener"  class="has-text-weight-bold" href="https://quipuswap.com/">Quipuwap</a>, a decentralized exchange on Tezos. The kUSD received in the trade are distributed ratably to all holders of the QLkUSD tokens, who will receive their portion of the new kUSD when they redeem their QLkUSD tokens.</p>

              <h3 class="title">Benefits</h3>
              <h5 class="title">kUSD Contributors</h5>
              <p>Users contributing kUSD receive several benefits for using the pool. First, they can work together to liquidate ovens larger than the collateral than any individual holder may have on hand. </p>
              <p>Secondly, if users all competed to liquidate the oven individually they would be competing on who was the fastest and had the highest transaction fees. The fastest user with the highest fees would receive everything, while all other users received nothing. By aligning all users together, users are likely to receive a portion of liquidation rewards more consistently.</p>

              <h5 class="title">Liquidators</h5>
              <p>Users who use the pool to liquidate are able to receive a portion of liquidated rewards without having to buy or hold kUSD. </p>

              <h5 class="title">Kolibri Protocol</h5>
              <p>The Kolibri Protocol requires ovens to be liquidated when they go underwater in order to maintain peg. The Kolibri protocol benefits from the liquidity pool because systemic risks from ovens that are too large for any individual to liquidate are more easily liquidated. </p>

              <h3 class="title">Risks</h3>
              <h5 class="title">Smart Contract Risk</h5>
              <p>All smart contract based systems carry smart contract risk, the risk that smart contracts do not work as intended. Please see the
                <router-link
                  rel="noopener"
                  target="_blank"
                  class="has-text-weight-bold"
                  :to="{ name: 'ProjectInfo', params: { folder: 'security', page: 'risks' } }"
                >
                  risks page
                </router-link> as part of the Kolibri documentation for more info about the general risks with using smart contracts on Tezos.
              </p>
              <p>There is no way to mitigate smart contract risk completely, however, good software engineering practices can help to build confidence in the security and correctness of implementation. The Kolibi Liquidation Pool contracts are <a href="https://github.com/hover-labs/liquidation-pool" rel="noopener" target="_blank">open sourced</a> and well tested, however, they <b>have not undergone a security audit</b>.</p>

              <h5 class="title">Market Manipulation Risks</h5>
              <p>When an oven is liquidated, the pool receives XTZ which it trades for kUSD on Quipuswap. Sophisticated users with significant capital may be able to manipulate prices on Quipuswap prior to using the pool to liquidate an oven in order to gain outsized profit.</p>
              <p>Any market is subject to manipulation, and there is no way to mitigate this risk completely. However, healthy and liquid markets generally prove harder to manipulate. Thus, the less healthy the Quipuswap market for kUSD is, the more risky the Liquidation Pool contracts behavior will be.</p>
            </div>
          </section>
          <footer class="modal-card-foot is-justify-content-flex-end">
            <button @click="learnMoreModalOpen = !learnMoreModalOpen" class="button is-primary has-text-weight-bold">Awesome!</button>
          </footer>
        </div>
      </div>
    </transition>

    <div class="columns is-centered">
      <div class="column is-half-desktop is-two-thirds-tablet">
        <div class="box is-paddingless">
          <div class="topper">
            <img class="pool" src="../assets/pool.svg">
            <div class="words">
              <h1 class="title has-text-white is-1">Kolibri</h1>
              <h3 class="subtitle has-text-white is-3">Liquidity Pool</h3>
              <button @click="learnMoreModalOpen = !learnMoreModalOpen" class="button is-outlined is-white">Learn More</button>
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
                <span class="tag is-medium is-marginless">kUSD Holdings</span>
                <span v-if="$store.walletBalance !== null" class="tag is-marginless is-medium is-primary">{{ numberWithCommas(walletBalanceFormatted().toFixed(2)) }} kUSD</span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader"></div>
                </span>
              </div>
              <div class="tags has-addons is-justify-content-flex-end is-marginless">
                <span class="tag is-marginless is-medium">LP Holdings</span>
                <span v-if="$store.lpBalance !== null" class="tag is-marginless is-medium is-primary">{{ numberWithCommas($store.lpBalance.dividedBy($store.lpMantissa).toFixed(2)) }}</span>
                <span v-else class="tag is-marginless is-medium is-primary">
                  <div class="loader"></div>
                </span>
              </div>

            </div>
          </div>

          <hr>

          <div class="management-buttons">

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
        learnMoreModalOpen: false,
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
    padding-bottom: 2rem;
    background: $light-grey;
    min-height: 100vh;
    z-index: 31;
    position: relative;
    .management-buttons{
      padding: 0 1rem 1.5rem;
    }
    .manage-liquidity-pool{
      .holdings{
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
