import BigNumber from 'bignumber.js'

export default defineNuxtPlugin(() => {
  BigNumber.config({ POW_PRECISION: 36, DECIMAL_PLACES: 36 })
})
