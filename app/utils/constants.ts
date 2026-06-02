import BigNumber from 'bignumber.js'

// STRICT defaults to true in bignumber.js v11+ (throws on invalid input). This module is
// imported early; disable STRICT here too so values built from user input return NaN
// (pre-v10 behaviour) rather than throwing. See app/plugins/bignumber.ts.
BigNumber.config({ POW_PRECISION: 36, DECIMAL_PLACES: 36, STRICT: false })

export const MUTEZ = new BigNumber(10).pow(6)
export const SHARD = new BigNumber(10).pow(18)
export const COLLATERAL_DIVISOR = new BigNumber(10).pow(20)

export const LEGACY_PAGES_DISABLED = true
