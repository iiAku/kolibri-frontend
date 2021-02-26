<template>
  <div class="box oven public-oven">
    <div class="top">
      <nav class="level is-mobile">
        <!-- Left side -->
        <div class="level-left">
          <div class="level-item">
            <h1 class="title is-5 is-family-monospace">
              <a
                target="_blank"
                rel="noopener"
                :href="tzktLink(oven.ovenAddress)"
                >
                {{ oven.ovenAddress }}
              </a>
            </h1>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button
                :disabled="pendingTransaction"
                v-if="$store.wallet !== null && !oven.isLiquidated && collatoralizedRateForOven(oven) > 100"
                @click="liquidateOven()"
                :class="{'is-loading': networkLoading}"
                class="button is-danger is-small">
              Liquidate
            </button>
          </div>
        </div>
      </nav>
    </div>

    <div v-if="pendingTransaction" class="loader-wrapper">
      <h1 class="title is-marginless is-5">
        <a
            :title="pendingTransaction"
            v-if="pendingTransaction !== true"
            target="_blank"
            rel="noopener"
            :href="tzktLink(pendingTransaction)"
        >
          Transaction Pending...
        </a>
        <span v-else>
          Transaction Pending...
        </span>
      </h1>
      <div class="loader left-spaced"></div>
    </div>
    <div v-else class="oven-info">
      <div v-if="oven.isLiquidated" class="liquidated-warning">
        <h1 class="title is-4 has-text-white">
          This Oven Has Been
          <router-link
            rel="noopener"
            target="_blank"
            :to="{
              name: 'ProjectInfo',
              params: { folder: 'liquidation', page: 'overview' },
            }"
            >Liquidated</router-link
          >
        </h1>
      </div>
      <div class="columns is-gapless">
        <div class="column is-flex is-flex-direction-column is-align-items-center is-justify-content-center">
          <div class="is-flex is-flex-direction-column is-justify-content-center left-info">
            <p class="heading">Delegated Baker: <strong><a target="_blank" rel="noopener" :href="`https://${this.$store.network === 'delphinet' ? 'delphinet.' : ''}tzkt.io/${oven.baker}/delegators`">{{ oven.baker }}</a></strong></p>
            <div class="is-flex is-justify-content-space-between">
              <p class="heading">Owned By:
                <a
                    target="_blank"
                    rel="noopener"
                    class="has-text-weight-semibold"
                    :href="tzktLink(oven.ovenOwner)"
                >
                  {{ oven.ovenOwner }}
                </a>
              </p>
              <p class="heading">Utilization:
                <strong v-if="collatoralizedRateForOven(oven) < 80">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else-if="collatoralizedRateForOven(oven) < 100" class="has-text-warning">{{ collatoralizedRateForOven(oven) }}%</strong>
                <strong v-else class="has-text-danger">{{ collatoralizedRateForOven(oven) }}%</strong>
              </p>
            </div>

            <div class="allocation-info is-fullwidth">
              <progress v-if="collatoralizedRateForOven(oven) < 80" class="progress is-primary" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else-if="collatoralizedRateForOven(oven) < 100" class="progress is-warning" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
              <progress v-else class="progress is-danger" :value="collatoralizedRateForOven(oven)" max="100">{{ collatoralizedRateForOven(oven) }}%</progress>
            </div>
          </div>
        </div>
        <div class="column">
          <nav class="level right-info">
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Collateral Value</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    ${{ numberWithCommas(ovenValue(oven.balance)) }} USD
                  </strong>

                  <strong class="price-has-popover"
                    >${{
                      numberWithCommas(ovenValue(oven.balance).toFixed(2))
                    }}
                    USD</strong
                  >
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Balance</p>
                <p class="title is-6">
                  <popover extra-classes="small-price">
                    <strong
                      slot="popup-content"
                      class="has-text-primary heading is-marginless"
                    >
                      {{
                        numberWithCommas(
                          oven.balance.dividedBy(Math.pow(10, 6))
                        )
                      }}
                      Ꜩ
                    </strong>

                    <strong class="price-has-popover"
                      >{{
                        numberWithCommas(
                          oven.balance.dividedBy(Math.pow(10, 6)).toFixed(2)
                        )
                      }}
                      Ꜩ
                    </strong>
                  </popover>
                </p>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Borrowed Tokens</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{
                      numberWithCommas(
                        oven.outstandingTokens.dividedBy(Math.pow(10, 18))
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover"
                    >{{
                      numberWithCommas(
                        oven.outstandingTokens
                          .dividedBy(Math.pow(10, 18))
                          .toFixed(2)
                      )
                    }}
                    kUSD</strong
                  >
                </popover>
              </div>
            </div>
            <div class="level-item has-text-centered">
              <div
                class="is-flex is-flex-direction-column is-align-items-center"
              >
                <p class="heading">Stability Fee</p>
                <popover extra-classes="small-price">
                  <strong
                    slot="popup-content"
                    class="has-text-primary heading is-marginless"
                  >
                    {{
                      numberWithCommas(
                        oven.stabilityFee.dividedBy(Math.pow(10, 18))
                      )
                    }}
                    kUSD
                  </strong>

                  <strong class="price-has-popover"
                    >{{
                      numberWithCommas(
                        oven.stabilityFee.dividedBy(Math.pow(10, 18)).toFixed(6)
                      )
                    }}
                    kUSD</strong
                  >
                </popover>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Mixins from "@/mixins";
import Popover from "@/components/Popover";

export default {
  name: "PublicOven",
  props: ["oven"],
  mixins: [Mixins],
  methods: {
    async liquidateOven(){
      this.networkLoading = true
      try {
        let tx = await this.ovenClient(this.oven.ovenAddress).liquidate()

        this.networkLoading = false

        debugger;
        this.pendingTransaction = tx.opHash

        await tx.confirmation(1)

        debugger;

        this.pendingTransaction = null

        this.$emit("oven-liquidated", this.oven.ovenAddress)
      } catch (e) {
        this.networkLoading = false
        this.handleWalletError(e, "Couldn't liquidate oven", "There was an issue liquidating this oven!")
      }
    },
    ovenValue(ovenBalance) {
      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      return currentValue.dividedBy(Math.pow(10, 2));
    },
    maxBorrowAmt(ovenBalance) {
      if (parseInt(ovenBalance) === 0) {
        return 0;
      }

      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      let valueHalf = currentValue.dividedBy(2);

      let borrowedTokens = this.oven.outstandingTokens.dividedBy(Math.pow(10, 18));

      return valueHalf.minus(borrowedTokens).dividedBy(100);
    },
    collatoralizedRate(ovenBalance) {
      if (parseInt(ovenBalance) === 0) {
        return 0;
      }

      let currentValue = this.$store.priceData.price
        .multipliedBy(ovenBalance)
        .dividedBy(Math.pow(10, 10));
      let valueHalf = currentValue.dividedBy(2);

      let rate = this.oven.outstandingTokens
        .dividedBy(valueHalf)
        .dividedBy(Math.pow(10, 14));

      return rate.toFixed(2);
    },
  },
  data() {
    return {
      pendingTransaction: null,
      networkLoading: false,
    };
  },
  computed: {
    liquidatablePrice(){
      let rateDelta = 1 - this.currentCollateralRate(this.ovenAddress).dividedBy(100).toNumber()
      let currentPrice = this.$store.priceData.price.dividedBy(Math.pow(10, 6))

      return currentPrice.minus(currentPrice.times(rateDelta))
    },
  },
  components: {
    Popover,
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";

.public-oven {
  @include until($desktop) {
    .level-item {
      white-space: nowrap;
      .title {
        text-overflow: ellipsis;
        max-width: 90vw;
        overflow: hidden;
      }
    }
  }
}
</style>
