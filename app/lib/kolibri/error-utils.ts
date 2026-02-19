import { ContractErrors } from './types'

const ERROR_ID_SCRIPT_REJECTED = 'proto.007-PsDELPH1.michelson_v1.script_rejected'

const ErrorUtils = {
  contractErrorFromTaquitoException: (exception: any): ContractErrors => {
    const errors: Array<any> = exception.errors
    if (errors === undefined) {
      return ContractErrors.Unknown
    }

    for (let i = 0; i < errors.length; i++) {
      const error = errors[i]
      const id: string = error.id
      if (id === undefined) {
        continue
      }

      if (id === ERROR_ID_SCRIPT_REJECTED) {
        const withValue = error.with
        if (withValue === undefined) {
          continue
        }

        const errorCodeString: string = withValue.int
        if (errorCodeString === undefined) {
          continue
        }

        const errorCode = parseInt(errorCodeString)
        if (Number.isNaN(errorCode)) {
          continue
        }

        return errorCode
      }
    }

    return ContractErrors.Unknown
  },
}

export default ErrorUtils
