<template>
  <Transition enter-active-class="animate__animated animate__fadeIn fast">
    <div v-if="bakerAddress && validBakerAddress(bakerAddress)" class="new-baker-info">
      <div v-if="baker" class="box baker-info is-flex is-flex-direction-row">
        <div class="image-wrapper">
          <div class="image is-96x96">
            <img :src="bakerAvatarUrl(bakerAddress)" />
          </div>
        </div>
        <div class="baker-info-content">
          <div class="content">
            <h2 class="subtitle is-marginless is-4">
              <a target="_blank" rel="noopener" :href="`https://${store.network === 'mainnet' ? '' : store.network + '.'}tzkt.io/${bakerAddress}`">
                {{ baker.alias }}
              </a>
            </h2>
            <div class="field is-grouped is-grouped-multiline baker-tags">
              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Delegators</span>
                  <span class="tag is-primary">{{ baker.numDelegators }}</span>
                </div>
              </div>
              <div class="control">
                <div class="tags has-addons">
                  <span class="tag">Staking Balance</span>
                  <span class="tag is-primary">{{ formatStakingBalance(baker.stakingBalance) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="box baker-info is-flex is-flex-direction-row">
        <div class="image-wrapper">
          <div class="image is-96x96">
            <img :src="bakerAvatarUrl(bakerAddress)" />
          </div>
        </div>
        <div class="unknown-baker-info-content">
          <div class="content">
            <h2 class="subtitle is-marginless is-4">
              <a target="_blank" rel="noopener" :href="`https://${store.network === 'mainnet' ? '' : store.network + '.'}tzkt.io/${bakerAddress}`">
                Unknown Baker
              </a>
            </h2>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKolibriStore } from '~/stores/kolibri'
import { useWallet } from '~/composables/useWallet'
import { useBakers } from '~/composables/useBakers'

const props = defineProps<{ bakerAddress: string }>()

const store = useKolibriStore()
const { validBakerAddress } = useWallet()
const { bakers, bakerAvatarUrl } = useBakers()

const baker = computed(() => bakers.value[props.bakerAddress] ?? null)

const formatStakingBalance = (mutez: number) => {
  const xtz = mutez / 1_000_000
  if (xtz >= 1_000_000) return `${(xtz / 1_000_000).toFixed(1)}M XTZ`
  if (xtz >= 1_000) return `${(xtz / 1_000).toFixed(0)}K XTZ`
  return `${xtz.toFixed(0)} XTZ`
}
</script>

<style lang="scss">
.baker-info {
  padding: 0;
  border: 1px solid #eee;
  .subtitle {
    padding: 1rem 1rem 0;
    margin: 0;
  }
  .image-wrapper {
    padding: 1rem;
    border-right: 1px solid #eee;
    display: flex;
    align-items: center;
  }
  .baker-tags {
    padding: 1rem;
  }
  .unknown-baker-info-content {
    width: 100%;
    display: flex;
    align-items: center;
    .subtitle {
      padding: 0 1rem;
    }
  }
}
</style>
