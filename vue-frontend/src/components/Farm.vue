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
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-info">{{ pairName }} Holdings</span>
              <span v-if="holdingsData" class="tag is-light">{{ holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2) }} {{ pairName }}</span>
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
            <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(farmContractData.farmLpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
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
                <p v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ numberWithCommas(depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa).toFixed(2)) }} {{ pairName }}</p>
                <p v-else class="has-text-white has-text-weight-bold">0.00 {{ pairName }}</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Pool %</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ currentPoolPercentage.times(100).toFixed(2) }}%</p>
                <p v-else class="has-text-white has-text-weight-bold">0%</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">Your Reward Rate</p>
                </div>
              </div>

              <div class="level-right">
                <p v-if="depositedTokens !== undefined && !this.depositedTokens.lpTokenBalance.isZero()" class="has-text-white has-text-weight-bold">{{ numberWithCommas(currentDripRate.toFixed(2)) }} kDAO / Week</p>
                <p v-else class="has-text-white has-text-weight-bold">0.00 kDAO / Week</p>
              </div>
            </nav>
            <nav class="level is-marginless">
              <div class="level-left">
                <div class="level-item">
                  <p class="has-text-white has-text-weight-bold">
                    Claimable Rewards
                    <popover extra-classes="small-price">
                      <strong
                        slot="popup-content"
                        class="is-marginless"
                      >
                        Due to the way reward calculations are determined,<br>
                        your claimed amount might be included in a different <br>
                        block than was expected/displayed here, so you may <br>
                        receive a *slightly* different amount than this.
                      </strong>
                      <span>(<a>
                        <strong class="has-text-white is-underlined">est</strong>
                      </a>)</span>
                    </popover>
                  </p>
                </div>
              </div>

              <div class="level-right">
                <p class="has-text-white has-text-weight-bold">{{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO.mantissa).toFixed(2)) }} kDAO</p>
              </div>
            </nav>
<br>

            <div class="columns is-centered">
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="depositInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="depositInput = holdingsData.balance.dividedBy(decimalsMap[pairName].mantissa).toFixed(36)"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="depositTokens"
                      :class="{'is-loading': networkSending}"
                      :disabled="this.networkSending || Math.sign(depositInput) < 1"
                      class="button is-info"
                    >
                      Deposit {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="field has-addons has-addons-centered">
                  <div class="control">
                    <input v-model="withdrawInput" class="input" type="number" placeholder="1.234">
                    <div
                      @click="withdrawInput = depositedTokens ? depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa) : 0"
                      class="max-button heading"
                    >
                      Max
                    </div>
                  </div>
                  <div class="control">
                    <button
                      @click="withdrawTokens"
                      :class="{'is-loading': networkSending}"
                      :disabled="networkSending || Math.sign(withdrawInput) < 1 || withdrawInput > depositedTokens.lpTokenBalance.dividedBy(decimalsMap[pairName].mantissa)"
                      class="button is-info"
                    >
                      Withdraw {{ pairName }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="buttons is-right">
              <button
                :disabled="networkSending || estimatedRewards.isZero()"
                :class="{'is-loading': networkSending}"
                @click="claim"
                class="button is-info"
              >
                Claim {{ numberWithCommas(estimatedRewards.dividedBy(this.decimalsMap.kDAO.mantissa).toFixed(2)) }} kDAO
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
import Popover from "@/components/Popover";

BigNumber.set({ DECIMAL_PLACES: 36 })

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
      const balanceMap = this.decimalsMap[this.pairName].balances()
      const holdingsData = await balanceMap.get(this.$store.walletPKH)
      if (holdingsData === undefined){
        this.holdingsData = {balance: new BigNumber(0)}
      } else {
        this.holdingsData = holdingsData
      }
      this.depositedTokens = await this.farmContractData.delegators.get(this.$store.walletPKH)
    },
    async claim(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)

        const sendResult = await farmContract.methods.claim(null).send()

        this.$eventBus.$emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null

        this.$eventBus.$emit('refresh-kdao-holdings')
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        this.$eventBus.$emit('tx-finished')
      }
    },
    async depositTokens(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
        const tokenContract = await this.$store.tezosToolkit.wallet.at(this.farmContractData.addresses.lpTokenContract)
        const sendAmt = new BigNumber(this.depositInput).times(this.decimalsMap[this.pairName].mantissa)

        const sendResult = await this.$store.tezosToolkit.wallet.batch([])
          .withContractCall(tokenContract.methods.approve(this.contract, sendAmt))
          .withContractCall(farmContract.methods.deposit(sendAmt))
          .send()

        this.$eventBus.$emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        this.$eventBus.$emit('tx-finished')
        this.depositInput = null
      }
    },
    async withdrawTokens(){
      this.networkSending = true
      try {
        const farmContract = await this.$store.tezosToolkit.wallet.at(this.contract)
        const sendAmt = new BigNumber(this.withdrawInput).times(this.decimalsMap[this.pairName].mantissa)

        const sendResult = await farmContract.methods.withdraw(sendAmt).send()

        this.$eventBus.$emit('tx-submitted', sendResult)

        await sendResult.confirmation(1)

        this.holdingsData = null
        await this.initialize()
      } catch (e) {
        console.error(e)
      } finally {
        this.networkSending = false
        this.$eventBus.$emit('tx-finished')
        this.withdrawInput = null
      }
    }
  },
  computed: {
    poolRate(){
      const minutesPerWeek = 10080;
      // Testnet uses 30s blocks, mainnet is 1m. TODO: Will need updated for granada
      const blocksPerWeek = this.$store.isTestnet ? minutesPerWeek * 2 : minutesPerWeek
      if (this.farmContractData.farmLpTokenBalance.isZero()){
        return this.farmContractData.farmLpTokenBalance
      } else {
        return this.farmContractData.farm.plannedRewards.rewardPerBlock.times(blocksPerWeek).dividedBy(this.decimalsMap.kDAO.mantissa)
      }
    },
    currentReward(){
      if (this.farmContractData.farmLpTokenBalance.isZero()){
        return this.farmContractData.farmLpTokenBalance
      } else {
        return this.poolRate.dividedBy(this.farmContractData.farmLpTokenBalance.dividedBy(this.decimalsMap[this.pairName].mantissa))
      }
    },
    currentPoolPercentage(){
      if (this.depositedTokens.lpTokenBalance.isZero()){
        return new BigNumber(0)
      } else {
        return this.depositedTokens.lpTokenBalance.dividedBy(this.farmContractData.farmLpTokenBalance)
      }
    },
    currentDripRate(){
      return this.currentPoolPercentage.times(this.poolRate)
    },
    estimatedRewards(){
      if (this.depositedTokens === undefined || this.depositedTokens.lpTokenBalance.isZero()){
        return new BigNumber(0)
      }
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

      const lpMantissa = new BigNumber(10).pow(36)

      const accRewardPerShareEnd = this.farmContractData.farm.accumulatedRewardPerShare.plus(reward.times(lpMantissa).div(this.farmContractData.farmLpTokenBalance))

      const accumulatedRewardPerShare = accRewardPerShareEnd.minus(accRewardPerShareStart)
      return accumulatedRewardPerShare.times(this.depositedTokens.lpTokenBalance).dividedBy(lpMantissa)
      // return accumulatedRewardPerShare.times(this.depositedTokens.lpTokenBalance).dividedBy(Math.pow(10, 6))
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
      withdrawInput: null,
      depositInput: null,
      decimalsMap: {
        'kUSD': {
          mantissa: new BigNumber(10).pow(18),
          balances: () => this.tokenContractData.balances,
        },
        'kDAO': {
          mantissa: new BigNumber(10).pow(18),
          balances: () => this.tokenContractData.balances,
        },
        'kUSD Quipu LP': {
          mantissa: new BigNumber(10).pow(6),
          balances: () => this.tokenContractData.storage.ledger,
        },
        'QLPkUSD': {
          mantissa: new BigNumber(10).pow(36),
          balances: () => this.tokenContractData.balances,
        },
      }
    }
  },
  components: {
    Popover
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .farm{
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
    strong.is-underlined{
      border-bottom: 1px solid white;
    }
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
