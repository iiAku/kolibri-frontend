<script setup lang="ts">
import BigNumber from 'bignumber.js'
import { SHARD } from '~/utils/constants'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()

const globalClaimableRewards = ref<Record<string, { claimable: BigNumber; contract: any; contractAddress: string }>>({})
const networkSending = ref(false)

const isDoneGettingClaimableRewards = computed(() => {
  const farmCount = Object.keys(store.farmContracts).length
  const rewardInfoCount = Object.keys(globalClaimableRewards.value).length
  return farmCount === rewardInfoCount
})

const totalClaimable = computed(() => {
  let total = new BigNumber(0)
  for (const rewardInfo of Object.values(globalClaimableRewards.value)) {
    total = total.plus(rewardInfo.claimable)
  }
  return total
})

const updateClaimableRewards = ({ contract, estimatedRewards }: { contract: string; estimatedRewards: BigNumber }) => {
  if (globalClaimableRewards.value[contract] === undefined) return
  globalClaimableRewards.value[contract].claimable = estimatedRewards
}

const claimAll = async () => {
  networkSending.value = true
  try {
    let batch = await store.tezosToolkit.wallet.batch([])

    for (const rewardInfo of Object.values(globalClaimableRewards.value)) {
      if (rewardInfo.claimable.dividedBy(SHARD).isGreaterThan(0.005)) {
        batch = batch.withContractCall(rewardInfo.contract.methodsObject.claim(null))
      }
    }

    const sendResult = await batch.send()

    $eventBus.emit('tx-submitted', sendResult)

    await sendResult.confirmation(1)

    globalClaimableRewards.value = {}
    $eventBus.emit('refresh-farms')
  } catch (e) {
    console.error(e)
  } finally {
    networkSending.value = false
    $eventBus.emit('tx-finished')
  }
}

const addContractHoldings = (contractHoldingsInfo: { contractAddress: string; claimable: BigNumber; contract: any }) => {
  globalClaimableRewards.value[contractHoldingsInfo.contractAddress] = contractHoldingsInfo
}

const updatekDAOHoldings = async () => {
  store.kdaoHoldings = null
  const kDAOToken = await store.tezosToolkit.wallet.at(store.daoToken)
  const kDAOStorage = await kDAOToken.storage() as any
  store.kdaoHoldings = await kDAOStorage.balances.get(store.walletPKH!)
}

onMounted(() => {
  if (store.walletPKH !== null) {
    nextTick(updatekDAOHoldings)
  } else {
    $eventBus.on('wallet-connected', updatekDAOHoldings)
  }
  $eventBus.on('refresh-kdao-holdings' as any, updatekDAOHoldings)
})

onUnmounted(() => {
  $eventBus.off('wallet-connected', updatekDAOHoldings)
  $eventBus.off('refresh-kdao-holdings' as any, updatekDAOHoldings)
})
</script>

<template>
  <div class="farming">
    <div class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-warning">
          <p class="title has-text-centered">These Farms Are Deprecated!</p>
          <p>
            New farms can be found at <a rel="noopener" target="_blank" href="https://quipuswap.com/farming">https://quipuswap.com/farming</a>, with a much better interface! Please withdraw your liquidity and migrate it to the new pool/s.
          </p>
        </div>
      </div>
    </div>
    <div v-if="!store.isTestnet && !store.isSandbox && store.currentBlockHeight !== null" class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div v-if="store.currentBlockHeight <= 1589248" class="notification is-warning">
          <strong>Please note!</strong><br> Mainnet currently uses 1 min block times, so farms are currently emitting at <strong>50%</strong> of their planned schedule until the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a> goes live. Once live, farm emissions will double from their current drip rate (lasting ~1 year)
        </div>
        <div v-else-if="store.currentBlockHeight < 1609408" class="notification is-primary">
          With the passing of the <a target="_blank" rel="noopener" href="https://tzstats.com/election/29"><strong>Granada proposal</strong></a>, Mainnet has just switched to 30s block times! The farm rewards are now <strong>doubled</strong> from their previous drip rate thanks to the upgrade!
        </div>
      </div>
    </div>
    <div v-if="store.isSandbox" class="columns is-centered is-gapless">
      <div class="column is-half-desktop">
        <div class="notification is-primary has-text-centered">
          <b>Sandbox block times are ~4s, so farms will emit at a very high rate!</b>
        </div>
      </div>
    </div>
    <div class="columns is-centered is-gapless farms">
      <div class="column is-three-quarters-desktop">
        <div v-if="store.wallet !== null" class="buttons is-centered">
          <button
            class="button is-info is-medium has-text-weight-bold"
            :disabled="!isDoneGettingClaimableRewards || networkSending || totalClaimable.isLessThan(0.005)"
            :class="{ 'is-loading': !isDoneGettingClaimableRewards || networkSending }"
            @click="claimAll"
          >
            Claim All {{ totalClaimable.dividedBy(SHARD).toFixed(2) }} kDAO
          </button>
        </div>

        <Farm
          v-for="(contract, pairName) in store.farmContracts"
          :key="pairName"
          :contract="contract"
          :pair-name="(pairName as string)"
          :global-sending="networkSending"
          @new-estimated-rewards="updateClaimableRewards($event)"
          @initialized="addContractHoldings($event)"
        />
      </div>
    </div>
  </div>
</template>

<style type="text/scss" lang="scss">
  .farming{
    min-height: calc(100vh - 4rem - 5px);
    background: $light-grey;
    position: relative;
    z-index: 39;
    .columns{
      &:first-child{
        padding-top: 2.5rem;
      }
      .box{
        background: $primary;
        color: white;
      }
    }
    .farms{
      padding-bottom: 3rem;
    }
  }
</style>
