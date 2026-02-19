<script setup lang="ts">
import { TezosLanguageUtil } from 'conseiljs'

const store = useKolibriStore()
const { $eventBus } = useNuxtApp()

const message = ref<string | null>(null)
const signatureResult = ref<any>(null)

const decodedMessage = computed(() => {
  if (message.value === null || !message.value.startsWith('0x')) {
    return null
  }
  return TezosLanguageUtil.normalizeMichelsonWhiteSpace(
    TezosLanguageUtil.hexToMichelson(message.value.substring(4)).code,
  )
})

const signPayload = async () => {
  const payload = {
    payload: message.value!.substring(2),
    signingType: 'micheline' as const,
  }
  signatureResult.value = await store.wallet.client.requestSignPayload(payload)
  console.log(signatureResult.value)
}
</script>

<template>
  <div class="signing-tool animate__animated animate__fadeIn">
    <div class="container is-max-desktop">
      <div class="box">
        <div class="header">
          <h1 class="title is-4 is-marginless">Multi-Sig Signing Tool</h1>
        </div>
        <div class="columns is-marginless">
          <div class="column is-paddingless">
            <div class="signer-content content">
              <div class="field">
                <label class="label">Message</label>
                <div class="control">
                  <textarea v-model="message" class="textarea" placeholder="0x..."></textarea>
                </div>
              </div>
              <div class="field">
                <label class="label">Decoded Message</label>
                <div class="control">
                  <textarea :value="decodedMessage" readonly class="textarea" placeholder="Your Decoded Payload Will Appear Here"></textarea>
                </div>
              </div>
              <div class="field">
                <label class="label">Signature</label>
                <div class="control">
                  <input v-if="signatureResult === null" :disabled="signatureResult === null" class="input" placeholder="Signature Will Appear Here">
                  <input v-else v-model="signatureResult.signature" class="input" readonly placeholder="Signature Will Appear Here">
                </div>
              </div>
              <div class="field is-grouped is-grouped-right">
                <div class="control">
                  <button v-if="store.wallet !== null" :disabled="signatureResult !== null" class="button is-primary" @click="signPayload">Sign Message</button>
                  <button v-else class="button is-primary" @click="$eventBus.emit('wallet-connect-request')">Connect Wallet</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" type="text/scss">
  .signing-tool{
    background: $light-grey;
    min-height: calc(100vh - 4rem - 5px);
    .function{
      margin-left: 1rem;
    }
    .container{
      padding: 3rem 0;
    }
    .is-height-full{
      height: 100%;
    }
    .box{
      padding: 0;
      .header{
        padding: 1rem 2rem;
        border-bottom: 2px solid $light-grey;
      }
      .signer-content{
        padding: 1rem 2rem;
      }
    }
  }
</style>
