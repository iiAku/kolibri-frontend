<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn fast"
      leave-active-class="animate__animated animate__fadeOut fast"
  >
    <div class="box farm">

      <div v-if="farmContractData !== null">
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <h1 class="title has-text-white">{{ pairName }} Farm</h1>
            </div>
          </div>

          <div class="level-right"></div>
        </nav>

        <div v-if="$store.walletPKH !== null" class="field is-grouped is-grouped-multiline">
          <div v-if="pairName !== 'kDAO'" class="control">
            <div class="tags has-addons">
              <span class="tag is-info">{{ pairName }} Holdings</span>
              <span v-if="holdingsData" class="tag is-light">{{ holdingsData.balance.dividedBy(decimalsMap[pairName]).toFixed(2) }} {{ pairName }}</span>
              <span v-else class="tag is-light"><div class="loader"></div></span>
            </div>
          </div>
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-info">kDAO Holdings</span>
              <span v-if="$store.kdaoHoldings" class="tag is-light">{{ $store.kdaoHoldings.balance.dividedBy(decimalsMap.kDAO).toFixed(2) }} kDAO</span>
              <span v-else class="tag is-light"><div class="loader"></div></span>
            </div>
          </div>
        </div>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Total Deposited</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(farmContractData.farmLpTokenBalance.dividedBy(decimalsMap[pairName]).toFixed(2)) }} {{ pairName }}</p>
          </div>
        </nav>
        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Pool Rate</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(poolRate.toFixed(2)) }} kDAO / Week</p>
          </div>
        </nav>

        <nav class="level is-marginless">
          <div class="level-left">
            <div class="level-item">
              <p class="has-text-white has-text-weight-bold">Current Reward</p>
            </div>
          </div>

          <div class="level-right">
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(currentReward.toFixed(2)) }} kDAO / Week Per {{ pairName }}</p>
          </div>
        </nav>

        <div v-if="$store.walletPKH !== null">
          <hr>

          <div v-if="depositedTokens !== null">
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Deposits</p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName]).toFixed(2)) }} {{ pairName }}</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Pool %</p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">{{ currentPoolPercentage.times(100).toFixed(2) }}%</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Reward Rate</p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(currentDripRate.toFixed(2)) }} kDAO / Week</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Claimable Rewards (est)</p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO).toFixed(2)) }} kDAO</p>
              </div>
            </nav>
<br>
            <div class="buttons is-right">
              <button :class="{'is-loading': networkSending}" @click="depositTokens" class="button is-outlined is-white has-text-weight-bold">
                Deposit 1 kUSD
              </button>
              <button :disabled="estimatedRewards.isZero()" :class="{'is-loading': networkSending}" @click="claim" class="button is-outlined is-white has-text-weight-bold">
                Claim {{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO).toFixed(2)) }} kDAO
              </button>
            </div>

          </div>
          <div v-else class="loader-wrapper">
            <div class="loader is-large is-white"></div>
          </div>
        </div>
      </div>
      <div v-else class="loader-wrapper">
        <div class="loader is-large is-white"></div>
      </div>
    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins";
import BigNumber from "bignumber.js";

export default {
  name: 'Farm',
  props: ['pairName', 'contract'],
  mixins: [Mixins],
  async mounted(){
    this.$nextTick(this.initialize)
  },
  methods: {
    async initialize(){
      const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
      this.farmContractData = await farmContract.storage()
      const tokenContract = await this.$store.tezosToolkit.wallet.at(this.farmContractData.addresses.lpTokenContract)
      this.tokenContractData = await tokenContract.storage()
      if (this.$store.walletPKH !== null){
        await this.updateTokenBalance()
      } else {
        this.$eventBus.$on('wallet-connected', this.updateTokenBalance)
      }
    },
    async updateTokenBalance(){
      this.holdingsData = await this.tokenContractData.balances.get(this.$store.walletPKH)
      this.depositedTokens = await this.farmContractData.delegators.get(this.$store.walletPKH)
    },
    async claim(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)

        const sendResult = await farmContract.methods.claim(null).send()

        this.pendingTx = sendResult

        await sendResult.confirmation(1)

        this.holdingsData = null

        this.$eventBus.$emit('refresh-kdao-holdings')
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        this.pendingTx = null
      }
    },
    async depositTokens(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
        const tokenContract = await this.$store.tezosToolkit.wallet.at(this.farmContractData.addresses.lpTokenContract)
        const sendAmt = new BigNumber(1).times(new BigNumber(10).pow(18))

        const sendResult = await this.$store.tezosToolkit.wallet.batch([])
          .withContractCall(tokenContract.methods.approve(this.contract, sendAmt))
          .withContractCall(farmContract.methods.deposit(sendAmt))
          .send()

        this.pendingTx = sendResult

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        this.pendingTx = null
      }
    }
  },
  computed: {
    poolRate(){
      const minutesPerWeek = 10080;
      return this.farmContractData.farm.plannedRewards.rewardPerBlock.times(minutesPerWeek).dividedBy(this.decimalsMap[this.pairName])
    },
    currentReward(){
      return this.poolRate.dividedBy(this.farmContractData.farmLpTokenBalance.dividedBy(this.decimalsMap[this.pairName]))
    },
    currentPoolPercentage(){
      return this.depositedTokens.lpTokenBalance.dividedBy(this.farmContractData.farmLpTokenBalance)
    },
    currentDripRate(){
      return this.currentPoolPercentage.times(this.poolRate)
    },
    estimatedRewards(){
      const accRewardPerShareStart = this.depositedTokens.accumulatedRewardPerShareStart

      const nextBlock = new BigNumber(this.$store.currentBlockHeight + 1)
      const multiplier = nextBlock.minus(this.farmContractData.farm.lastBlockUpdate)
      const outstandingReward = multiplier.times(this.farmContractData.farm.plannedRewards.rewardPerBlock)
      const claimedRewards = this.farmContractData.farm.claimedRewards.paid.plus(this.farmContractData.farm.claimedRewards.unpaid)
      const totalRewards = outstandingReward.plus(claimedRewards);
      const plannedRewards = this.farmContractData.farm.plannedRewards.rewardPerBlock.times(this.farmContractData.farm.plannedRewards.totalBlocks)
      const totalRewardsExhausted = totalRewards.isGreaterThan(plannedRewards);
      const reward = totalRewardsExhausted
        ? plannedRewards.minus(claimedRewards)
        : outstandingReward;

      const accRewardPerShareEnd = this.farmContractData.farm.accumulatedRewardPerShare.plus(reward.times(1000000).div(this.farmContractData.farmLpTokenBalance))

      const accumulatedRewardPerShare = accRewardPerShareEnd.minus(accRewardPerShareStart)
      return accumulatedRewardPerShare.times(this.depositedTokens.lpTokenBalance).dividedBy(Math.pow(10, 6))
    },
  },
  data(){
    return {
      farmContract: null,
      farmContractData: null,
      tokenContractData: null,
      holdingsData: null,
      depositedTokens: null,
      networkSending: false,
      pendingTx: null,
      decimalsMap: {
        'kUSD': new BigNumber(10).pow(18),
        'kDAO': new BigNumber(10).pow(18)
      }
    }
  },
  components: {
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .farm{
    hr.bottomless{
      margin-bottom: 0;
    }
    .title{
      margin-bottom: .5rem;
    }
    .button.is-white{
      &:hover{
        color: $primary;
        &[disabled]{
          color: white;
        }
      }
      &:focus{
        border-color: $primary;
        color: $primary;
        &[disabled]{
          color: white;
          border-color: white;
        }
        &.is-loading::after{
          border-color: transparent transparent $primary $primary !important
        }
      }
    }
  }
</style>
