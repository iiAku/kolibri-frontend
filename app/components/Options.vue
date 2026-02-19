<template>
  <div class="options">
    <Transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
    >
      <div :key="'menu'" v-show="popupOpen" class="menu">
        <button @click="popupOpen = false" class="delete"></button>
        <div class="contents">
          <div class="contracts">
            <h1 class="title is-6 has-text-white is-marginless">Contracts</h1>
            <div class="content">
              <ul class="has-text-white">
                <li :key="contractKey" v-for="(contractName, contractKey) in contracts">
                  <b>
                    <a class="has-text-white" target="_blank" rel="noopener" :href="bcdLink(store.NETWORK_CONTRACTS[contractKey])">
                      {{ contractName }}
                    </a>
                  </b>
                </li>
              </ul>
            </div>
          </div>

          <nav class="level node-selector">
            <div class="level-item form-label">
              <div class="is-flex is-align-items-center">
                <div v-show="networkLoading" class="loader is-white"></div>
                <p class="has-text-weight-bold has-text-white">RPC Node</p>
              </div>
            </div>
            <div class="level-item">
              <div class="select is-small">
                <select v-model="selectedNode">
                  <option
                    :key="nodeName"
                    :value="(nodeAddresses as any)[store.network]"
                    v-for="(nodeAddresses, nodeName) in validNodes"
                  >
                    {{ nodeName }}
                  </option>
                  <option
                    v-if="getItem(store.nodeOverrideKey) && !nodesContainsNode(getItem(store.nodeOverrideKey)!)"
                    :value="getItem(store.nodeOverrideKey)"
                  >
                    {{ getItem(store.nodeOverrideKey) }}
                  </option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          </nav>

          <div class="ipfs-links">
            <p class="has-text-white">
              This site is continuously deployed to
              <a target="_blank" rel="noopener" href="https://docs.ipfs.io/concepts/what-is-ipfs/" class="has-text-white has-text-weight-bold">IPFS</a>
              with the url:
            </p>
            <pre>ipns://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn</pre>
            <p class="help has-text-white has-text-centered">* Make sure to bookmark it!</p>
            <div class="buttons is-centered">
              <a target="_blank" rel="noopener" href="https://k51qzi5uqu5dlgtiu5vs75r2cfim0qn9rezu804nrw6x38h85kh8q8c4ake3vn.ipns.dweb.link" class="button is-outlined is-white">
                <b>dWeb IPNS Site</b>
              </a>
              <a target="_blank" rel="noopener" href="https://kusd.tez.page/" class="button is-outlined is-white">
                <b>Tezos Domains</b>
              </a>
            </div>
          </div>

          <div class="translate-wrapper">
            <h1 class="title is-6 has-text-white is-marginless">Translation</h1>
            <div class="load-google-translate">
              <button
                v-if="!hasLoadedGTranslate"
                :class="{ 'is-loading': loadingGTranslate }"
                @click="loadGTranslate"
                class="button is-white is-outlined has-text-weight-semibold"
              >
                Load Google Translate
              </button>
            </div>
            <div id="google_translate_element"></div>
            <p v-show="hasLoadedGTranslate" class="heading has-text-white">
              Powered by
              <a rel="noopener" target="_blank" class="has-text-white has-text-weight-semibold" href="https://translate.google.com/">Google Translate</a>
            </p>
          </div>
        </div>
      </div>
    </Transition>
    <Transition
      enter-active-class="animate__animated animate__fadeInUp animate__faster"
      leave-active-class="animate__animated animate__fadeOutDown animate__faster"
    >
      <div :key="'cog'" @click="popupOpen = true" v-show="!popupOpen" class="options-button">
        <img src="~/assets/cog.svg" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useKolibriStore } from '~/stores/kolibri'
import { useLinks } from '~/composables/useLinks'

const store = useKolibriStore()
const { $swal } = useNuxtApp()
const { bcdLink } = useLinks()

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const popupOpen = ref(false)
const selectedNode = ref(store.nodeURL)
const networkLoading = ref(false)
const hasLoadedGTranslate = ref(false)
const loadingGTranslate = ref(false)

const contracts: Record<string, string> = {
  MINTER: 'Minter',
  TOKEN: 'kUSD Token',
  OVEN_PROXY: 'Oven Proxy',
  OVEN_FACTORY: 'Oven Factory',
  OVEN_REGISTRY: 'Oven Registry',
  DEVELOPER_FUND: 'Developer Fund',
  STABILITY_FUND: 'Stability Fund',
  ORACLE: 'Oracle',
  LIQUIDITY_POOL: 'Liquidity Pool',
  SAVINGS_POOL: 'Kolibri Savings Rate',
}

const nodes: Record<string, Record<string, string>> = store.isSandbox
  ? {
      "Hover Labs' Sandbox": { sandboxnet: 'https://sandbox.hover.engineering' },
      '127.0.0.1:8732': { sandboxnet: 'http://127.0.0.1:8732' },
    }
  : {
      ECADLabs: { mainnet: 'https://mainnet.ecadinfra.com' },
      TzKT: { mainnet: 'https://rpc.tzkt.io/mainnet' },
      SmartPy: { mainnet: 'https://mainnet.smartpy.io' },
    }

const validNodes = computed(() =>
  Object.fromEntries(
    Object.entries(nodes).filter(([_, nodeInfo]) => (nodeInfo as any)[store.network] !== undefined),
  ),
)

const getItem = (itemKey: string): string | null => localStorage.getItem(itemKey)

const nodesContainsNode = (nodeURL: string): boolean =>
  Object.values(nodes).some((addresses) => nodeURL === (addresses as any)[store.network])

const waitForElmById = (id: string): Promise<Element> =>
  new Promise((resolve) => {
    const el = document.getElementById(id)
    if (el) return resolve(el)

    const observer = new MutationObserver(() => {
      const found = document.getElementById(id)
      if (found) {
        resolve(found)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })

const loadGTranslate = async () => {
  loadingGTranslate.value = true
  ;(window as any).googleTranslateElementInit = () => {
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: 'en',
        layout: (window as any).google.translate.TranslateElement.InlineLayout.VERTICAL,
      },
      'google_translate_element',
    )
  }

  const translateScript = document.createElement('script')
  translateScript.setAttribute(
    'src',
    'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit',
  )
  document.head.appendChild(translateScript)

  await waitForElmById(':0.targetLanguage')

  loadingGTranslate.value = false
  hasLoadedGTranslate.value = true
}

onMounted(async () => {
  if (document.cookie.includes('googtrans=') && !document.cookie.includes('googtrans=/en/en')) {
    await loadGTranslate()
  }
})

watch(selectedNode, async (newValue, oldValue) => {
  if (newValue === 'CUSTOM') {
    const result = await $swal.fire({
      title: 'Please Specify A Node URL',
      input: 'text',
      inputAttributes: { autocapitalize: 'off', placeholder: 'https://some.tezos.node' },
      showCancelButton: true,
      confirmButtonText: 'Set Node',
      showLoaderOnConfirm: true,
      preConfirm: async (nodeURL: string) => {
        nodeURL = nodeURL
          .replace(/\/+$/, '')
          .replaceAll(' ', '')
          .replaceAll('\n', '')
          .replaceAll('<', '')
          .replaceAll('>', '')
          .replaceAll('{', '')
          .replaceAll('}', '')

        try {
          new URL(nodeURL)
        } catch (e: any) {
          $swal.showValidationMessage(escapeHtml(String(e)))
          return false
        }

        try {
          await axios.get(nodeURL + '/chains/main/blocks/head/header')
          return nodeURL
        } catch (e: any) {
          $swal.showValidationMessage(`Request failed: ${escapeHtml(String(e))}`)
          return false
        }
      },
      allowOutsideClick: false,
    })

    if (result.isDismissed) selectedNode.value = oldValue!
    if (result.isConfirmed) {
      localStorage.setItem(store.nodeOverrideKey, result.value)
      location.reload()
    }
  } else {
    networkLoading.value = true
    try {
      await axios.get(newValue + '/chains/main/blocks/head/header')
      localStorage.setItem(store.nodeOverrideKey, newValue)
      location.reload()
    } catch (e: any) {
      console.error(e)
      $swal.fire(
        'Could Not Connect',
        `There was an error in the selected node!<br><pre class="has-text-left">${escapeHtml(JSON.stringify(e, null, 2))}</pre>`,
        'error',
      )
    } finally {
      networkLoading.value = false
    }
  }
})
</script>

<style lang="scss">
@keyframes rotateForever {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.options {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 99;
  max-width: 30rem;
  .translate-wrapper {
    display: flex;
    align-items: center;
    flex-direction: column;
    position: relative;
    min-height: 45px;
    border-top: 1px solid white;
    padding-top: 0.5rem;
    & > h1 { align-self: flex-start; }
    .goog-logo-link { display: none; }
    .goog-te-gadget { font-size: 0; }
  }
  .contents {
    max-height: 90vh;
    overflow-y: scroll;
    padding: 1rem;
  }
  @media screen and (max-width: 30rem) {
    max-width: 97%;
  }
  .node-selector {
    border-top: 1px solid white;
    margin-bottom: 0 !important;
    padding: 0.5rem;
  }
  .options-button {
    cursor: pointer;
    border-radius: 50%;
    padding: 0.45rem;
    margin: 1rem 1.5rem;
    border: 2px solid white;
    background: $primary;
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.1), 0 0px 0 1px rgba(10, 10, 10, 0.02);
    display: flex;
    position: absolute;
    height: 3rem;
    width: 3rem;
    right: 0;
    bottom: 0;
    &:hover {
      img { animation: rotateForever 1.5s linear infinite; }
    }
  }
  .contracts {
    margin-bottom: 0.5rem;
    ul { column-count: 2; }
  }
  .menu {
    background: $primary;
    position: relative;
    border-top-left-radius: 5px;
    border-left: 2px solid white;
    border-top: 2px solid white;
    .form-label {
      margin-right: 1rem;
      .loader { margin-right: 0.5rem; }
    }
    .delete {
      position: absolute;
      left: -0.55rem;
      top: -0.55rem;
      background: white;
      border: 2px solid $primary;
      &::before, &::after { background-color: $primary; }
    }
  }
  .ipfs-links {
    border-top: 1px solid white;
    padding: 0.5rem 0;
    pre { padding: 0.25rem 0.5rem; }
    .buttons { margin-top: 0.5rem; margin-bottom: 0.25rem; }
  }
}
body > .skiptranslate { display: none; }
#goog-gt-tt { display: none !important; }
.goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
body { top: 0 !important; }
</style>
