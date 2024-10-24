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
export function YandexMetrikaLoader() {
  // Функция для динамической загрузки Yandex Metrica
  function loadYandexMetrica() {
    // Проверяем, загружен ли скрипт уже
    if (window?.isYandexMetricaLoaded)
      return

    const script = document.createElement('script')
    script.src = 'https://mc.yandex.ru/metrika/tag.js'
    script.async = true
    document.body.appendChild(script)

    // Инициализация Yandex Metrica
    window.ym = window.ym || function (...args: any[]) {
      // @ts-expect-error-next-line
      (window.ym!.a = window.ym!.a || []).push(args)
    }

    // Инициализируем метрику с идентификатором
    window.ym('62509765', 'init', {
      consoleLog: false,
      webvisor: true,
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    })

    window.isYandexMetricaLoaded = true
  }

  // Обработчик первого взаимодействия
  function handleFirstInteraction() {
    loadYandexMetrica()
    window.removeEventListener('scroll', handleFirstInteraction)
    window.removeEventListener('click', handleFirstInteraction)
  }

  // Добавляем слушатели событий для первого взаимодействия
  window.addEventListener('scroll', handleFirstInteraction)
  window.addEventListener('click', handleFirstInteraction)
}
