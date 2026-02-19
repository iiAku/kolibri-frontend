<template>
  <Transition
    enter-active-class="animate__animated animate__fadeIn"
    leave-active-class="animate__animated animate__fadeOut"
  >
    <div>
      <div :class="{ 'is-active': opened }" class="sandbox-override modal">
        <div @click="opened = false" class="modal-background"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Update Overrides</p>
            <button @click="opened = false" class="delete" aria-label="close"></button>
          </header>
          <section class="modal-card-body">
            <textarea class="textarea" v-model="sandboxOverride" />
          </section>
          <footer class="modal-card-foot buttons is-right">
            <button @click="activateChanges" class="button is-primary">Activate Raw Changes</button>
            <button @click="activateDeployJSON" class="button is-primary">Activate Deploy JSON</button>
            <button @click="opened = false" class="button">Cancel</button>
          </footer>
        </div>
      </div>
      <div class="opener">
        <p>
          Overriding
          <span v-if="initialSandboxProps && initialSandboxProps !== 'null'">
            {{ initialSandboxProps.match(/[^\\]":/g)?.length ?? 0 }}
          </span>
          <span v-else>0</span>
          Properties
          <a class="button is-small is-primary" @click="opened = true">Edit</a>
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const opened = ref(false)
const sandboxOverride = ref(localStorage.getItem('sandbox-overrides') ?? '')
const initialSandboxProps = ref(localStorage.getItem('sandbox-overrides'))

const getNestedValue = (obj: any, path: string): any =>
  path.split('.').reduce((acc, key) => acc?.[key], obj)

const activateDeployJSON = () => {
  const parsedDeployLog = JSON.parse(sandboxOverride.value)
  const overrideMap: Record<string, string> = {
    MINTER: 'kolibri.minterContractDeployResult.contractAddress',
    OVEN_PROXY: 'kolibri.ovenProxyDeployResult.contractAddress',
    OVEN_FACTORY: 'kolibri.ovenFactoryDeployResult.contractAddress',
    TOKEN: 'kolibri.kUSDDeployResult.contractAddress',
    OVEN_REGISTRY: 'kolibri.ovenRegistryDeployResult.contractAddress',
    DEVELOPER_FUND: 'kolibri.devFundDeployResult.contractAddress',
    STABILITY_FUND: 'kolibri.stabilityFundDeployResult.contractAddress',
    ORACLE: 'kolibri.oracleDeployResult.contractAddress',
    LIQUIDITY_POOL: 'deployed-liquidity-pool.contractAddress',
    QUIPUSWAP_POOL: 'deployed-quipuswap-pool.contractAddress',
  }

  const newOverride: Record<string, any> = {}

  for (const [key, path] of Object.entries(overrideMap)) {
    const result = getNestedValue(parsedDeployLog, path)
    if (result === undefined || result === null) {
      alert(`Invalid deploy item ${key} - ${path}`)
    }
    newOverride[key] = result
  }

  sandboxOverride.value = JSON.stringify({ contracts: newOverride }, null, 2)
  localStorage.setItem('sandbox-overrides', sandboxOverride.value)
  location.reload()
}

const activateChanges = () => {
  try {
    if (sandboxOverride.value.trim() === '' || sandboxOverride.value === null) {
      localStorage.removeItem('sandbox-overrides')
    } else {
      localStorage.setItem(
        'sandbox-overrides',
        JSON.stringify(JSON.parse(sandboxOverride.value), null, 2),
      )
    }
    location.reload()
  } catch (e: any) {
    alert(`Error setting override! ${e.toString()}`)
  }
}
</script>

<style lang="scss">
.sandbox-override {
  z-index: 99 !important;
  .modal-card {
    height: 90vh;
  }
  textarea {
    height: 100%;
  }
}
.opener {
  position: fixed;
  left: 0;
  bottom: 0;
  background: white;
  padding: 1rem 1rem;
  border-top-right-radius: 5px;
  z-index: 98;
  border-top: 2px solid #40bc93;
  border-right: 2px solid #40bc93;
}
</style>
