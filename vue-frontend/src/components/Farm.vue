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
          
          <div class="level-right">
            <button
              v-if="$store.walletPKH !== null"
              class="button is-white is-outlined has-text-weight-bold"
              :class="{'is-loading': networkSending}"
              @click="depositTokens"
            >
              Deposit 1 {{ pairName }}
            </button>
          </div>
        </nav>

        <div v-if="$store.walletPKH !== null" class="field is-grouped is-grouped-multiline">
          <div class="control">
            <div class="tags has-addons">
              <span class="tag is-dark">{{ pairName }} Holdings</span>
              <span v-if="holdingsData" class="tag is-light">{{ holdingsData.balance.dividedBy(decimalsMap[pairName]).toFixed(2) }} {{ pairName }}</span>
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

        <hr class="bottomless">

        <br><pre v-html="JSON.stringify(farmContractData, null, 2)"></pre>
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
        this.holdingsData = await this.tokenContractData.balances.get(this.$store.walletPKH)
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
  },
  data(){
    return {
      farmContract: null,
      farmContractData: null,
      tokenContractData: null,
      holdingsData: null,
      networkSending: false,
      pendingTx: null,
      decimalsMap: {
        'kUSD': new BigNumber(10).pow(18)
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
      }
      &:focus{
        border-color: $primary;
        color: $primary;
        &.is-loading::after{
          border-color: transparent transparent $primary $primary !important
        }
      }
    }
  }
</style>
