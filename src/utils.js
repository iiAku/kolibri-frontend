import BigNumber from "bignumber.js"
/*
Credits goes to: https://github.com/Hover-Labs/kolibri-js/blob/master/src/oven-client.ts
As the vast majority of helpers from here were either took, modified or inspired from kolibri-js module
*/

const MUTEZ_DIGITS = 6
const SHARD_DIGITS = 18

const MUTEZ_TO_SHARD = new BigNumber(Math.pow(10, SHARD_DIGITS - MUTEZ_DIGITS))

const SHARD_PRECISION = new BigNumber(Math.pow(10, SHARD_DIGITS))

export const customGetCollateralUtilization = (
  price,
  balance,
  outstandingTokens
) => {
  const priceShard = price.multipliedBy(MUTEZ_TO_SHARD)
  const collateralValue = balance
    .multipliedBy(MUTEZ_TO_SHARD)
    .multipliedBy(priceShard)
    .dividedBy(SHARD_PRECISION)

  return new BigNumber(
    outstandingTokens
      .times(Math.pow(10, SHARD_DIGITS))
      .dividedBy(collateralValue)
      .toFixed(0)
  )
}
