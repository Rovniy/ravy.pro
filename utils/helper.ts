/**
 * Converts the first character of the provided string to an uppercase letter
 * while leaving the rest of the string unchanged.
 *
 * @param {string} val - The input string to modify.
 * @return {string} A new string with the first character in uppercase. If the input string is empty, returns the input string.
 */
export function makeFirstCharUpper(val: string) {
  if (val === '')
    return val

  const firstChar = val.at(0)?.toLocaleUpperCase() || ''
  const otherChar = val.slice(1)

  return firstChar + otherChar
}

export function formatBlogDate(iso?: string): string {
  if (!iso)
    return 'no-date'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return 'no-date'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function daysSince(iso?: string): number {
  if (!iso)
    return Number.POSITIVE_INFINITY
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - d.getTime()) / 86_400_000)
}

declare global {
  interface Window {
    isYandexMetricaLoaded?: boolean
    ym?: (...args: any[]) => void
  }
}
