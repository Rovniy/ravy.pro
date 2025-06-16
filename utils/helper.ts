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
