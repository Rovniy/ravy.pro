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

/**
 * Динамическая загрузка скрипта аналитики
 */
// Расширяем объект window, чтобы добавить нужные свойства
declare global {
  interface Window {
    isYandexMetricaLoaded?: boolean
    ym?: (...args: any[]) => void
  }
}
