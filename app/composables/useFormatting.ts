export const useFormatting = () => {
  const numberWithCommas = (str: string | number | { toString: () => string }): string => {
    const parts = str.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }

  const truncateChars = (fullStr: string, strLen: number, separator = '...'): string => {
    if (fullStr.length <= strLen) return fullStr

    const sepLen = separator.length
    const charsToShow = strLen - sepLen
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)

    return fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
  }

  const formatNumber = (num: number | string, places = 2): string =>
    parseFloat(String(num)).toLocaleString(undefined, {
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    })

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds} seconds`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''}`
    const days = Math.floor(hours / 24)
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  return { numberWithCommas, truncateChars, formatNumber, formatDuration }
}
