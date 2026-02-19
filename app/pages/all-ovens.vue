<script setup lang="ts">
import type { OvenData } from '~/types'

const store = useKolibriStore()
const route = useRoute()
const { collatoralizedRateForOven } = useOvenCalculations()

const currentPage = ref(1)
const hideEmptyOvens = ref(true)
const hideLiquidatedOvens = ref(true)
const orderByCollateralization = ref(true)
const orderByValue = ref(false)
const searchTerm = ref<string | null>(null)

onMounted(() => {
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page as string)
  }
})

watch(() => route.query.page, (page) => {
  if (page) {
    currentPage.value = parseInt(page as string)
  }
})

const chunk = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

const activeVaults = computed(() => {
  if (!store.allOvensData) return []

  let ovens = store.allOvensData
    .filter((oven: OvenData) => {
      if (hideEmptyOvens.value) {
        if (!hideLiquidatedOvens.value && oven.isLiquidated) return true
        return !oven.balance.isEqualTo(0)
      }
      return true
    })
    .filter((oven: OvenData) => {
      if (hideLiquidatedOvens.value) return !oven.isLiquidated
      return true
    })

  ovens = [...ovens].sort((a, b) => {
    if (a.isLiquidated !== b.isLiquidated) {
      return a.isLiquidated ? 1 : -1
    }

    if (orderByValue.value) {
      const diff = b.balance.minus(a.balance).toNumber()
      if (diff !== 0) return diff
    }

    if (orderByCollateralization.value) {
      return parseFloat(collatoralizedRateForOven(b)) - parseFloat(collatoralizedRateForOven(a))
    }

    return 0
  })

  if (searchTerm.value !== null && searchTerm.value.length > 0) {
    const term = searchTerm.value.toLowerCase()
    ovens = ovens.filter((oven: OvenData) => {
      if (oven.baker && oven.baker.toLowerCase().includes(term)) return true
      if (oven.ovenOwner.toLowerCase().includes(term)) return true
      if (oven.ovenAddress.toLowerCase().includes(term)) return true
      return false
    })
  }

  return chunk(ovens, 10)
})

const currentChunk = computed(() => activeVaults.value[currentPage.value - 1] ?? [])

const totalPages = computed(() => activeVaults.value.length)

const markOvenLiquidated = (ovenAddress: string) => {
  if (!store.allOvensData) return
  const ovenIndex = store.allOvensData.findIndex((oven: OvenData) => oven.ovenAddress === ovenAddress)
  if (ovenIndex !== -1) {
    store.allOvensData[ovenIndex].isLiquidated = true
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  navigateTo({ path: '/all-ovens', query: { page: String(page) } })
}
</script>

<template>
  <section class="all-ovens hero is-fullheight is-align-items-center">
    <div
      v-if="store.allOvensData !== null && store.priceData !== null && activeVaults.length > 10"
      class="floating-paginator animate__animated animate__fadeInUp"
    >
      <nav class="pagination is-centered is-small" role="navigation" aria-label="pagination">
        <a
          class="pagination-previous"
          :disabled="currentPage <= 1 || undefined"
          @click="currentPage > 1 && goToPage(currentPage - 1)"
        >Previous</a>
        <a
          class="pagination-next"
          :disabled="currentPage >= totalPages || undefined"
          @click="currentPage < totalPages && goToPage(currentPage + 1)"
        >Next</a>
        <ul class="pagination-list">
          <li v-for="page in Math.min(totalPages, 5)" :key="page">
            <a
              class="pagination-link"
              :class="{ 'is-current': page === currentPage }"
              @click="goToPage(page)"
            >{{ page }}</a>
          </li>
          <li v-if="totalPages > 5">
            <span class="pagination-ellipsis">&hellip;</span>
          </li>
          <li v-if="totalPages > 5">
            <a
              class="pagination-link"
              :class="{ 'is-current': totalPages === currentPage }"
              @click="goToPage(totalPages)"
            >{{ totalPages }}</a>
          </li>
        </ul>
      </nav>
    </div>
    <div v-if="store.allOvensData === null || store.priceData === null" class="loading-wrapper">
      <div class="loader is-large is-primary"></div>
    </div>
    <div v-else class="container oven-data is-fluid">
      <div class="columns is-centered is-gapless">
        <div class="column is-three-quarters box filters">
          <div class="paginator-widget">
            <div class="columns is-gapless">
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="hideEmptyOvens" type="checkbox">
                  Hide Empty Ovens?
                </label>
              </div>
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="hideLiquidatedOvens" type="checkbox">
                  Hide Liquidated Ovens?
                </label>
              </div>
              <div class="column has-text-centered">
                <label class="checkbox">
                  <input v-model="orderByValue" type="checkbox">
                  Order Ovens By Value?
                </label>
              </div>
            </div>
            <div class="is-flex is-justify-content-center search">
              <div class="field is-horizontal">
                <div class="field-label is-normal">
                  <label class="label">Search</label>
                </div>
                <div class="field-body">
                  <div class="field">
                    <div class="control">
                      <input v-model="searchTerm" class="input" type="text" placeholder="Any Contract or Wallet Address">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicOven
        v-for="oven in currentChunk"
        :key="oven.ovenAddress"
        :oven="oven"
        @oven-liquidated="markOvenLiquidated"
      />
    </div>
  </section>
</template>

<style type="text/scss" lang="scss">
  .all-ovens{
    background: $light-grey;
    padding-bottom: 3rem;
    .floating-paginator{
      position: fixed;
      bottom: 0;
      z-index: 999;
      background: white;
      padding: .5rem;
      border-top-right-radius: 5px;
      border-top-left-radius: 5px;
    }
    .little-padding{
      padding-bottom: 0.5rem;
    }
    .oven-data{
      padding-top: 0 !important;
    }
    .paginator-widget{
      .paginator-list {
        flex-wrap: nowrap;
      }
      .column{
        padding: 1rem !important;
        padding-bottom: 0 !important;
      }
    }
    &.is-fullheight{
      min-height: calc(100vh - 4rem - 5px);
    }
    .hero-body{
      width: 85vw;
    }
    .loading-wrapper{
      width: 100%;
      height: calc(100vh - 4rem - 5px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container.oven-data{
      @include until($tablet){
        padding: .5rem;
      }
      @include from($desktop){
        padding: 2.5rem 5rem;
      }
    }
    .box.filters{
      margin-top: 1.5rem;
    }
    .search{
      margin: 1.5rem;
      .field{
        width: 50%;
        @include until($widescreen){
          width: 75%;
        }
        @include until($tablet){
          width: 100%;
          padding-bottom: 1rem;
        }
      }
    }
  }
</style>
