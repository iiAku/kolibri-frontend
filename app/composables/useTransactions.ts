import { ContractErrors } from '~/lib/kolibri'

const escapeHtml = (str: string): string =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const errorMap: Record<string, string> = {
  Unknown: 'An unknown error has occurred!',
  NotOven: "The Oven you're interacting with isn't registered in the OvenRegistry.",
  NotOvenProxy: 'An unknown error has occurred!',
  NotOracle: 'An unknown error has occurred!',
  NotGovernor: 'An unknown error has occurred!',
  NotMinter: 'An unknown error has occurred!',
  NotOwner: 'An unknown error has occurred!',
  NotOvenFactory: 'An unknown error has occurred!',
  NotAdmin: 'An unknown error has occurred!',
  NotPauseGuardian: 'An unknown error has occurred!',
  NotUnderCollateralized: 'This oven is not below liquidation threshold, and cannot be liquidated.',
  OvenUnderCollateralized: "This transaction failed because it would've left the oven under-collateralized.",
  BadState: 'An unknown error has occurred!',
  BadDestination: 'An unknown error has occurred!',
  WrongAsset: 'An unknown error has occurred!',
  AmountNotAllowed: 'An unknown error has occurred!',
  Liquidated: "This oven is already liquidated, so we can't interact with it!",
  StaleData: 'The oracle data is older than 30 mins, so the system is paused until the oracle is updated.',
  Paused: 'The system is currently paused, either for maintenance or due to some issue.',
  CannotReceiveFunds: 'An unknown error has occurred!',
  DebtCeiling: "This transaction would've pushed the system above the global debt ceiling.",
  OvenMaximumExceeded: 'Oven debt ceiling thing',
  TokenNoTransferPermission: 'An unknown error has occurred!',
  TokenInsufficientBalance: 'An unknown error has occurred!',
  TokenUnsafeAllowanceChange: 'An unknown error has occurred!',
  TokenNotAdministrator: 'An unknown error has occurred!',
}

export const useTransactions = () => {
  const { $swal } = useNuxtApp()

  const handleWalletError = (err: any, title: string, message: string) => {
    console.error('Error with wallet operation: ', err)

    let errString = message

    const properError = err.errors?.find((error: any) => error.with !== undefined)

    if (properError !== undefined) {
      const errorCode = parseInt(properError.with.int)
      const parsedError = (ContractErrors as Record<number, string>)[errorCode]
      errString += `(<b>Error Code: ${errorCode}</b>)<br><br>`
      errString += `<p>${errorMap[parsedError] ?? 'An unknown error has occurred!'}</p>`
    } else {
      const serialized = JSON.stringify(err, null, 2)
      const detail = serialized === '{}' && err.message ? err.message : serialized
      errString += `<br><pre class="has-text-left">${escapeHtml(detail)}</pre>`
    }

    $swal.fire(title, errString, 'error')
  }

  return { handleWalletError }
}
