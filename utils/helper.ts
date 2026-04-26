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

const TAG_COLORS = [
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
]

export function tagColorClass(tag: string): string {
  const hash = tag.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  return TAG_COLORS[hash % TAG_COLORS.length]!
}

declare global {
  interface Window {
    isYandexMetricaLoaded?: boolean
    ym?: (...args: any[]) => void
  }
}
