<template>
  <div class="stats">
    <nav class="level">
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Active Ovens</p>
          <p v-if="$store.ovenCount === null" class="loader"></p>
          <p v-else class="title">{{ $store.ovenCount }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Stability Fee (yearly)</p>
          <p v-if="$store.stabilityFee === null" class="loader"></p>
          <p v-else-if="typeof $store.stabilityFee === 'string'" class="title">{{ $store.stabilityFee }}</p>
          <p v-else class="title">{{ formattedStabilityFee() }}</p>
        </div>
      </div>
      <div class="level-item has-text-centered">
        <div class="is-flex is-flex-direction-column is-align-items-center">
          <p class="heading">Collateral Ratio</p>
          <p v-if="$store.collateralRate === null" class="loader"></p>
          <p v-else class="title">{{ formattedCollateralRate() }}%</p>
        </div>
      </div>
    </nav>

    <div v-if="!showAll" class="seperator is-relative">
      <div class="more has-text-centered">
        <a @click="showAll = true" class="more-link heading">
          More <i class="arrow down"></i>
        </a>
      </div>

      <hr />
    </div>
    <div class="animate__animated animate__fadeIn" v-else>
      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">All Tez in Kolibri Ovens</p>
            <p v-if="$store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title"> {{ $store.balanceData }} </p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    ($store.balanceData.totalBalance / Math.pow(10, 6)).toFixed(0)
                )
              }}
              <span class="subtitle">ꜩ</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Value Of All Ovens</p>
            <p v-if="$store.priceData === null || $store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title">{{ $store.balanceData }}</p>
            <p v-else class="title">
              ${{
                numberWithCommas(
                    (
                        $store.balanceData.totalBalance
                            .dividedBy(Math.pow(10, 6))
                            .times($store.priceData.price.dividedBy(Math.pow(10,6)))
                    ).toFixed(0)
                )
              }}
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Total kUSD In Existence</p>
            <p v-if="$store.balanceData === null" class="loader"></p>
            <p v-else-if="typeof $store.balanceData === 'string'" class="title">{{ $store.balanceData }}</p>
            <p v-else class="title">
              {{ numberWithCommas($store.balanceData.totalTokens.toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Current Debt Ceiling</p>

            <p v-if="$store.debtCeiling === null" class="loader"></p>
            <p v-else class="title">
              {{ numberWithCommas(this.$store.debtCeiling.dividedBy(Math.pow(10, 18)).toFixed(0)) }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <nav class="level">
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Stability Fund</p>

            <p v-if="$store.stabilityFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    this.$store.stabilityFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="heading">Development Fund</p>

            <p v-if="$store.devFundHoldings === null" class="loader"></p>
            <p v-else class="title">
              {{
                numberWithCommas(
                    this.$store.devFundHoldings.dividedBy(Math.pow(10, 18)).toFixed(2)
                )
              }}
              <span class="subtitle">kUSD</span>
            </p>
          </div>
        </div>
      </nav>

      <div class="seperator is-relative">
        <div class="more has-text-centered">
          <a @click="showAll = false" class="more-link heading">
            Less <i class="arrow up"></i>
          </a>
        </div>

        <hr />
      </div>
    </div>

    <div
      class="container price-container is-flex is-align-items-center is-justify-content-center"
    >
      <h1 class="subtitle is-marginless has-text-weight-normal">
        Latest
        <a href="https://harbinger.live" target="_blank" rel="noopener">
          XTZ/USD Oracle
        </a>
        Price:
      </h1>
      <div class="price-data">
        <p v-if="$store.priceData === null" class="loader is-small"></p>
        <p v-else class="title is-5 is-marginless">
          ${{
            $store.priceData.price
              .dividedBy(Math.pow(10, 6))
              .toFixed(2)
              .toLocaleString()
          }}
        </p>
      </div>
    </div>
    <p class="heading last-update-time">
      Oracle Last Updated
      <span
        v-if="$store.priceData === null"
        class="loader is-small is-inline-block"
      ></span>
      <strong v-else>
        <popover v-if="duration($store.priceData.time) > 30 * 60 * 1000">
          <div slot="popup-title">
            <strong class="has-text-danger">⛔ Warning</strong>
          </div>
          <div slot="popup-content">
            <strong>
              The price oracle has lagged behind longer than 30 minutes, so most
              functionality has been disabled by the protocol.
            </strong>
          </div>
          <span class="has-text-danger">
            ⛔️{{ humanTime($store.priceData.time) }} Ago
          </span>
        </popover>

        <popover v-else-if="duration($store.priceData.time) > 25 * 60 * 1000">
          <div slot="popup-title">
            <strong class="has-text-danger">⚠️ Warning</strong>
          </div>
          <div slot="popup-content">
            <strong>
              The price oracle seems to be lagging behind. If the oracle is more
              than 30 mins off, some functionality within the ovens is disabled
              by the protocol out of an abundance of caution.
            </strong>
          </div>
          <span>⚠️️{{ humanTime($store.priceData.time) }} Ago</span>
        </popover>

        <span v-else>{{ humanTime($store.priceData.time) }} Ago</span>
      </strong>
    </p>
  </div>
</template>

<script>
import moment from "moment";
import BigNumber from "bignumber.js";

import { ConversionUtils } from '@hover-labs/kolibri-js'
import Popover from "@/components/Popover";
import Mixins from "@/mixins";

import axios from "axios";

export default {
  name: "Stats",
  mixins: [Mixins],
  created() {
    console.log("Stats component created");
    setInterval(() => {
      this.now = moment();
    }, 1000);

    this.statsUpdateTimer = setInterval(this.updateStatsData, 30 * 1000);

    this.updateStatsData();
  },
  components: {
    Popover,
  },
  data() {
    return {
      now: moment(),
      showAll: false,
      statsUpdateTimer: null,
    };
  },
  methods: {
    updateStatsData() {
      this.$store.stableCoinClient.getOvenCount()
        .then((count) => {
          this.$store.ovenCount = count;
        })
        .catch((err) => {
          clearInterval(this.statsUpdateTimer)
          console.error("Error getting oven count ", err)
          this.$store.ovenCount = "?";
        });

      axios
        .get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/apy.json`)
        .then((result) => {
          this.$store.stabilityFee = new BigNumber(result.data.apy);
        })
        .catch(async () => {
          try {
            const minter = await this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.MINTER)
            const minterStorage = await minter.storage()
            this.$store.stabilityFee = minterStorage.stabilityFee
          } catch(e) {
            clearInterval(this.statsUpdateTimer)
            this.$store.stabilityFee = "?";
          }
        })

      axios
        .get(`https://kolibri-data.s3.amazonaws.com/${this.$store.network}/totals.json`)
        .then((result) => {
          const { totalBalance, totalTokens } = result.data;
          this.$store.balanceData = {
            totalBalance: new BigNumber(totalBalance),
            totalTokens: new BigNumber(totalTokens),
          };
        })
        .catch((err) => {
          clearInterval(this.statsUpdateTimer)
          console.error("Error getting oven count ", err)
          this.$store.balanceData = "?";
        })

      this.$store.tezosToolkit.contract.at(this.$store.NETWORK_CONTRACTS.TOKEN)
        .then(async (token) => {
          const storage = await token.storage()
          this.$store.debtCeiling = storage.debtCeiling
        })

      this.$store.stableCoinClient
        .getRequiredCollateralizationRatio()
        .then((rate) => {
          this.$store.collateralRate = rate;
        });

      this.$store.tokenClient.getBalance(this.$store.NETWORK_CONTRACTS.STABILITY_FUND)
        .then((holdings) => {
          this.$store.stabilityFundHoldings = holdings
        })

      this.$store.tokenClient.getBalance(this.$store.NETWORK_CONTRACTS.DEVELOPER_FUND)
          .then((holdings) => {
            this.$store.devFundHoldings = holdings
          })
    },
    formattedStabilityFee() {
      return ConversionUtils.shardToHumanReadablePercentage(
        this.$store.stabilityFee,
        2
      );
    },
    formattedCollateralRate() {
      return this.$store.collateralRate / new BigNumber(Math.pow(10, 18));
    },
    humanTime(time) {
      return this.duration(time).humanize();
    },
    duration(time) {
      return moment.duration(this.now - moment(time));
    },
  },
};
</script>

<style type="text/scss" lang="scss">
@import "../assets/sass/globals";
.stats {
  .more{
    position: absolute;
    top: -0.75rem;
    right: 0;
    left: 0;
    .more-link{
      display: inline-block;
      background: white;
      padding: .25rem .5rem;
      border-radius: 5px;
      border: 1px solid whitesmoke;
      &:hover{
        .arrow{
          border: solid $grey-dark;
          border-width: 0 1px 1px 0;
        }
      }
    }
  }

  .arrow {
    border: solid $primary;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 2px;
    margin-bottom: 0.15rem;
    &.down{
      transform: rotate(45deg);
      -webkit-transform: rotate(45deg);
    }
    &.up{
      transform: rotate(225deg);
      -webkit-transform: rotate(225deg);
    }
  }
  .loader {
    height: 2rem;
    width: 2rem;
    margin-top: 0.25rem;
    &.is-small {
      height: 1rem;
      width: 1rem;
    }
  }
  .last-update-time {
    text-align: center;
    margin: 0.5rem 0 0;
    .loader {
      margin-bottom: -4px;
    }
    .popper {
      max-width: 30rem;
      strong,
      p {
        text-transform: initial;
      }
    }
  }
  .price-container {
    a {
      border-bottom: 1px solid $grey-darker;
      font-weight: bold;
      color: $grey-darker;
      &:hover {
        color: $primary;
        border-bottom: 1px solid $primary;
      }
    }
    .subtitle {
      padding-right: 0.5rem;
    }
    .price-data {
      min-width: 4.625rem;
    }
  }
}
</style>
