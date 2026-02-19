<template>
  <div ref="rootEl" class="baker-select">
    <div class="field">
      <label class="label">Delegate Oven Funds To</label>
      <div :class="{ 'is-loading': loading }" class="control has-icons-right">
        <input
          ref="inputEl"
          class="input baker-select-input"
          :class="{ 'is-focused': open }"
          type="text"
          :value="inputDisplay"
          @input="onInput"
          @focus="onFocus"
          @keydown.escape="open = false"
          placeholder="Search bakers or paste address..."
          readonly
        />
        <span class="icon is-right baker-select-chevron" :class="{ 'is-flipped': open }">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </div>
    </div>

    <div v-if="error" class="notification is-warning is-light is-size-7 mb-2 p-2">
      {{ error }} — you can still paste a baker address manually.
    </div>

    <Teleport to="body">
      <div v-if="open" ref="dropdownEl" class="baker-dropdown" :style="dropdownStyle">
        <div class="baker-dropdown-search">
          <input
            ref="searchEl"
            class="input is-small"
            type="text"
            v-model="query"
            placeholder="Search by name or address..."
          />
        </div>
        <div class="baker-dropdown-list">
          <div
            v-if="defaultBakerInfo && (!query || defaultBakerMatchesQuery)"
            class="baker-dropdown-item is-default"
            @mousedown.prevent="select(defaultBaker!)"
          >
            <img class="baker-avatar" :src="bakerAvatarUrl(defaultBaker!)" />
            <div class="baker-item-info">
              <span class="baker-name">{{ defaultBakerInfo.alias }} <span class="tag is-primary is-light is-small">Recommended</span></span>
              <span class="baker-address">{{ truncateChars(defaultBaker!, 24) }}</span>
            </div>
            <span class="baker-delegators">{{ defaultBakerInfo.numDelegators }} delegators</span>
          </div>

          <template v-for="baker in filteredBakers" :key="baker.address">
            <div
              v-if="baker.address !== defaultBaker"
              class="baker-dropdown-item"
              @mousedown.prevent="select(baker.address)"
            >
              <img class="baker-avatar" :src="bakerAvatarUrl(baker.address)" />
              <div class="baker-item-info">
                <span class="baker-name">{{ baker.alias }}</span>
                <span class="baker-address">{{ truncateChars(baker.address, 24) }}</span>
              </div>
              <span class="baker-delegators">{{ baker.numDelegators }}</span>
            </div>
          </template>

          <div
            v-if="showCustomOption"
            class="baker-dropdown-item is-custom"
            @mousedown.prevent="select(query)"
          >
            <div class="baker-item-info">
              <span class="baker-name">Use custom address</span>
              <span class="baker-address">{{ query }}</span>
            </div>
          </div>

          <div v-if="!filteredBakers.length && !showCustomOption && !defaultBakerMatchesQuery" class="baker-dropdown-item is-empty">
            No bakers found
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useBakers } from '~/composables/useBakers'
import { useFormatting } from '~/composables/useFormatting'

const props = defineProps<{
  modelValue: string | null
  defaultBaker?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const { bakers, bakerList, loading, error, fetchBakers, searchBakers, bakerAvatarUrl } = useBakers()
const { truncateChars } = useFormatting()

const rootEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)
const dropdownEl = ref<HTMLElement | null>(null)
const open = ref(false)
const query = ref('')
const dropdownStyle = ref<Record<string, string>>({})

const inputDisplay = computed(() => {
  if (!props.modelValue) return ''
  const baker = bakers.value[props.modelValue]
  return baker?.alias ?? props.modelValue
})

const defaultBakerInfo = computed(() => {
  if (!props.defaultBaker) return null
  return bakers.value[props.defaultBaker] ?? null
})

const defaultBakerMatchesQuery = computed(() => {
  if (!props.defaultBaker || !query.value) return false
  const q = query.value.toLowerCase()
  const info = defaultBakerInfo.value
  return info?.alias?.toLowerCase().includes(q) || props.defaultBaker.toLowerCase().includes(q)
})

const filteredBakers = computed(() => {
  if (!query.value) return bakerList.value
  return searchBakers(query.value)
})

const showCustomOption = computed(() => {
  if (!query.value || query.value.length !== 36) return false
  if (query.value in bakers.value) return false
  return query.value.startsWith('tz')
})

const updateDropdownPosition = () => {
  if (!inputEl.value) return
  const rect = inputEl.value.getBoundingClientRect()
  dropdownStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 2}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: '10000',
  }
}

const onFocus = async () => {
  query.value = ''
  updateDropdownPosition()
  open.value = true
  await nextTick()
  searchEl.value?.focus()
}

const select = (address: string) => {
  emit('update:modelValue', address)
  query.value = ''
  open.value = false
}

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (rootEl.value?.contains(target)) return
  if (dropdownEl.value?.contains(target)) return
  open.value = false
}

watch(open, (val) => {
  if (!val) query.value = ''
})

onMounted(() => {
  fetchBakers()
  document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style lang="scss">
.baker-select {
  position: relative;

  .baker-select-input {
    cursor: pointer;
    caret-color: transparent;
    background-color: white;

    &::placeholder {
      color: #b5b5b5;
    }
  }

  .baker-select-chevron {
    pointer-events: none;
    color: #888;
    transition: transform 0.2s ease;

    &.is-flipped svg {
      transform: rotate(180deg);
    }
  }
}

.baker-dropdown {
  background: white;
  border: 1px solid #dbdbdb;
  border-radius: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  .baker-dropdown-search {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;

    .input {
      font-size: 0.85rem;
    }
  }

  .baker-dropdown-list {
    max-height: 280px;
    overflow-y: auto;
  }

  .baker-dropdown-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    gap: 0.5rem;

    &:hover {
      background-color: #f5f5f5;
    }

    &.is-default {
      border-bottom: 1px solid #eee;
      background-color: #fafff5;

      &:hover {
        background-color: #f0faeb;
      }
    }

    &.is-custom {
      border-top: 1px solid #eee;
      font-style: italic;
    }

    &.is-empty {
      color: #999;
      cursor: default;
      justify-content: center;
      padding: 1rem;

      &:hover {
        background: none;
      }
    }
  }

  .baker-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .baker-item-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .baker-name {
    font-weight: 500;
    font-size: 0.9rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .baker-address {
    font-size: 0.75rem;
    color: #999;
  }

  .baker-delegators {
    font-size: 0.75rem;
    color: #888;
    white-space: nowrap;
    flex-shrink: 0;
  }
}
</style>
