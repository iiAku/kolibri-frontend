import BigNumber from 'bignumber.js'

BigNumber.config({ POW_PRECISION: 36, DECIMAL_PLACES: 36 })

export const MUTEZ = new BigNumber(10).pow(6)
export const SHARD = new BigNumber(10).pow(18)
export const COLLATERAL_DIVISOR = new BigNumber(10).pow(20)

export const LEGACY_PAGES_DISABLED = true
