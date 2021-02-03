<template>
  <transition
      enter-active-class="animate__animated animate__fadeIn fast"
      leave-active-class="animate__animated animate__fadeOut fast"
  >
    <div v-if="bakerAddress && validBakerAddress" class="new-baker-info">

      <div v-if="bakerAddress === kolibriBaker" class="box baker-info is-flex is-flex-direction-row">
        <div class="image-wrapper">
          <div class="image is-64x64">
            <img src="../assets/hummingbird.svg" />
          </div>
        </div>
        <div class="unknown-baker-info-content">
          <div class="content">
            <h2 class="subtitle is-marginless">
              <a target="_blank" rel="noopener" :href="`https://${this.$store.network === 'delphinet' ? 'delphi.' : ''}.tzstats.com/${kolibriBaker}`">
                Kolibri Baker
              </a>
            </h2>
            <p class="subtitle"><strong>Thank you</strong> from the Kolibri team! 🙏🙇‍♂️</p>
          </div>
        </div>
      </div>
      <div v-else-if="bakers[bakerAddress]" class="box baker-info is-flex is-flex-direction-row">
        <div class="image-wrapper">
          <div class="image is-64x64">
            <img :src="bakers[bakerAddress].logo" />
          </div>
        </div>
        <div class="baker-info-content">
          <div class="content">
            <h2 class="subtitle is-marginless">
              <a target="_blank" rel="noopener" :href="`https://${this.$store.network === 'delphinet' ? 'delphi.' : ''}.tzstats.com/${bakerAddress}`">
                {{ bakers[bakerAddress].name }}
              </a>
            </h2>

            <div class="field is-grouped is-grouped-multiline baker-tags">
              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Open?</span>
                  <span v-if="bakers[bakerAddress].openForDelegation" class="tag is-primary">Yes</span>
                  <span v-else class="tag is-danger">No</span>
                </div>
              </div>

              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Estimated ROI</span>
                  <span class="tag is-primary">{{ (bakers[bakerAddress].estimatedRoi * 100).toFixed(2) }}%</span>
                </div>
              </div>

              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Fee</span>
                  <span class="tag is-primary">{{ (bakers[bakerAddress].fee * 100).toFixed(2) }}%</span>
                </div>
              </div>

              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Payout Timing</span>
                  <span class="tag is-primary">{{ bakers[bakerAddress].payoutTiming }}</span>
                </div>
              </div>

              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Payout Accuracy</span>
                  <span class="tag is-primary">{{ bakers[bakerAddress].payoutAccuracy }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="box baker-info is-flex is-flex-direction-row">
        <div class="image-wrapper">
          <div class="image is-64x64">
            <img src="../assets/unknown-icon.svg" />
          </div>
        </div>
        <div class="unknown-baker-info-content">
          <div class="content">
            <h2 class="subtitle is-marginless">
              <a target="_blank" rel="noopener" :href="`https://${this.$store.network === 'delphinet' ? 'delphi.' : ''}.tzstats.com/${bakerAddress}`">
                Unknown Baker
              </a>
            </h2>
          </div>
        </div>
      </div>

    </div>
  </transition>
</template>

<script>
import Mixins from "@/mixins";

export default {
  name: 'BakerInfo',
  props: ['bakerAddress', 'validBakerAddress', 'kolibriBaker', 'bakers'],
  mixins: [Mixins],
  async created(){
  },
  methods: {

  },
  data(){
    return {

    }
  },
  components: {
  },
}
</script>

<style type="text/scss" lang="scss">
  @import '../assets/sass/globals';

  .baker-info{
    padding: 0;
    border: 1px solid #eee;
    .subtitle{
      padding: 1rem;
      padding-bottom: 0;
      margin: 0;
    }
    .image-wrapper{
      padding: 1rem;
      border-right: 1px solid #eee;
      display: flex;
      align-items: center;
    }
    .baker-tags{
      padding: 1rem;
    }
    .unknown-baker-info-content{
      width: 100%;
      display: flex;
      align-items: center;
      .subtitle{
        padding: 0 1rem;
      }
    }
  }
</style>
