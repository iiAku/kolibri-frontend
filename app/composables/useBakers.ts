import { ref, computed } from 'vue'
import type { BakerInfo } from '~/types'

const bakers = ref<Record<string, BakerInfo>>({})
const loading = ref(false)
const error = ref<string | null>(null)
let fetched = false

const EXCLUDED_PATTERNS = [
  'coinbase', 'kraken', 'binance', 'gate.io', 'coinone',
  'tezos foundation',
  'objkt.com',
]

const isPublicBaker = (alias: string) =>
  !EXCLUDED_PATTERNS.some(pattern => alias.toLowerCase().includes(pattern))

const fetchBakers = async () => {
  if (fetched || loading.value) return
  loading.value = true
  error.value = null

  try {
    const response = await fetch(
      'https://api.tzkt.io/v1/delegates?active=true&alias.null=false&select=address,alias,stakingBalance,numDelegators&limit=10000',
    )
    if (!response.ok) throw new Error(`TzKT API error: ${response.status}`)

    const data: BakerInfo[] = await response.json()
    const byAddress: Record<string, BakerInfo> = {}
    for (const baker of data) {
      if (baker.alias !== null && isPublicBaker(baker.alias)) {
        byAddress[baker.address] = baker
      }
    }
    bakers.value = byAddress
    fetched = true
  } catch (err) {
    error.value = 'Failed to load baker list'
    console.error('Failed to fetch bakers:', err)
  } finally {
    loading.value = false
  }
}

export const useBakers = () => {
  const bakerList = computed(() =>
    Object.values(bakers.value).sort((a, b) => b.stakingBalance - a.stakingBalance),
  )

  const searchBakers = (query: string) => {
    const q = query.toLowerCase()
    return bakerList.value.filter(
      baker => baker.alias?.toLowerCase().includes(q) || baker.address.toLowerCase().includes(q),
    )
  }

  const bakerAvatarUrl = (address: string) =>
    `https://services.tzkt.io/v1/avatars/${address}`

  return {
    bakers,
    bakerList,
    loading,
    error,
    fetchBakers,
    searchBakers,
    bakerAvatarUrl,
  }
}
