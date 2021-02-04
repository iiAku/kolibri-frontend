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
                  <textarea class="textarea" placeholder="0x..." v-model="message"></textarea>
                </div>
              </div>
              <div class="field">
                <label class="label">Decoded Message</label>
                <div class="control">
                  <textarea v-text="decodedMessage" readonly class="textarea" placeholder="Your Decoded Payload Will Appear Here"></textarea>
                </div>
              </div>
              <div class="field">
                <label class="label">Human Readable</label>
                <div class="control">
                  <template v-if="message !== null">
                    <p class="is-family-monospace"><b>Send Amt:</b> {{ humanReadableMessage.mutezToSend }} mutez</p>
                    <p class="is-family-monospace"><b>ChainID:</b> {{ humanReadableMessage.chainID }}</p>
                    <p class="is-family-monospace"><b>OperationID:</b> {{ humanReadableMessage.operationID }}</p>
                    <p class="is-family-monospace"><b>Function:</b></p>
                    <p class="function">
                      Contract: <a>{{ humanReadableMessage.functionAddress }}</a>
                      <br>
                      Call: <a>{{ humanReadableMessage.functionCall }}</a>(<a>{{ humanReadableMessage.toAddress }}</a>)
                    </p>
                  </template>
                </div>
              </div>
              <div class="field">
                <label class="label">Signature</label>
                <div class="control">
                  <input :disabled="signatureResult === null" class="input" placeholder="Signature Will Appear Here" v-model="signatureResult" />
                </div>
              </div>
              <div class="field is-grouped is-grouped-right">
                <div class="control">
                  <button @click="signPayload" v-if="$store.wallet !== null" :disabled="signatureResult !== null" class="button is-primary">Sign Message</button>
                  <button class="button is-primary" @click="$eventBus.$emit('wallet-connect-request')" v-else>Connect Wallet</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { TezosLanguageUtil } from 'conseiljs'
  import { addressDecoder } from "@taquito/local-forging/dist/lib/codec";
  import { Uint8ArrayConsumer } from "@taquito/local-forging";

  export default {
    name: "SigningTool",
    data() {
      return {
        message: '0x0507070a00000004a836502107070002020000007f0320053d036d0743036e0a0000001601aec9fbb01f9f21d3c61b2379c13ddf40de32fc25000655036e0000001425736574476f7665726e6f72436f6e74726163740200000010072f0200000004034f032702000000000743036a00000743036e0a00000016010c21fa1ba5104ea31fcd8b4741f7e84fec3ce9d300034d031b',
        signatureResult: null,
      }
    },
    methods: {
      async signPayload(){
        this.signatureResult = await this.$store.wallet.sign(this.message)
      }
    },
    computed: {
      humanReadableMessage(){
        try {

          console.log(
              addressDecoder(
                  new Uint8ArrayConsumer.fromHexString('01e5fd66cc8fd280028be25a706ecd9f5a6c3e563700')
              )
          )
          const parsedMsg = JSON.parse(
              TezosLanguageUtil.normalizeMichelineWhiteSpace(
                  TezosLanguageUtil.hexToMicheline(this.message.substr(4)).code
              )
          )
          console.log(parsedMsg)

          const lambdaContents = parsedMsg.args[1].args[1]

          if (lambdaContents.length !== 9){
            throw Error("Unknown contract type! This is an early tool :grimace:")
          }

          return {
            chainID: "0x" + parsedMsg.args[0].bytes,
            operationID: parseInt(parsedMsg.args[1].args[0].int),
            functionAddress: addressDecoder(
                new Uint8ArrayConsumer.fromHexString(parsedMsg.args[1].args[1][2].args[1].bytes)
            ),
            functionCall: parsedMsg.args[1].args[1][3].annots[0],
            mutezToSend: parseInt(parsedMsg.args[1].args[1][5].args[1].int),
            toAddress: addressDecoder(
                new Uint8ArrayConsumer.fromHexString(parsedMsg.args[1].args[1][6].args[1].bytes)
            ),
            // lambdaContents,
            // parsedMsg
          }
        } catch(e) {
          console.log(e)
          return {}
        }
      },
      decodedMessage(){
        if (this.message === null || !this.message.startsWith('0x')){
          return null
        } else {
          return TezosLanguageUtil.normalizeMichelsonWhiteSpace(
            TezosLanguageUtil.hexToMichelson(this.message.substr(4)).code
          )
        }
      }
    }
  }
</script>

<style lang="scss" type="text/scss">
  @import '../assets/sass/globals';
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
