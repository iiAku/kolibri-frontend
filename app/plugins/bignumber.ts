import BigNumber from 'bignumber.js'

export default defineNuxtPlugin(() => {
  // STRICT defaults to true in bignumber.js v11+, which throws on invalid input. The UI
  // constructs BigNumbers directly from in-progress form fields (empty/partial strings), so
  // keep the pre-v10 behaviour of returning NaN instead of throwing and crashing validators.
  BigNumber.config({ POW_PRECISION: 36, DECIMAL_PLACES: 36, STRICT: false })
})
