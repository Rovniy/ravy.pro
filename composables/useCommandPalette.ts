import { EVENTS } from '~/data/analytics'

// Open/close state of the ⌘K palette, shared by the triggers (header, hero,
// keyboard shortcut) and the palette itself. The palette component is only
// mounted after the first open, so none of its code or its search index is in
// the initial bundle; `requested` is what flips that switch.

export type PaletteSource = 'shortcut' | 'header' | 'hero' | 'mobile'

export function useCommandPalette() {
  const isOpen = useState('cmdk:open', () => false)
  const requested = useState('cmdk:requested', () => false)
  /** Text to start with, e.g. from a hero suggestion chip. */
  const initialQuery = useState('cmdk:query', () => '')

  function open(source: PaletteSource, query = '') {
    if (isOpen.value)
      return
    initialQuery.value = query
    requested.value = true
    isOpen.value = true
    useAnalytics().track(EVENTS.PALETTE_OPEN, { source })
  }

  function close() {
    isOpen.value = false
  }

  function toggle(source: PaletteSource) {
    if (isOpen.value)
      close()
    else
      open(source)
  }

  return { isOpen, requested, initialQuery, open, close, toggle }
}

/** "⌘" on Apple platforms, "Ctrl" elsewhere. SSR renders "⌘" and corrects on mount. */
export function useModKey() {
  const label = ref('⌘')
  onMounted(() => {
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform
    label.value = /mac|iphone|ipad|ipod/i.test(platform) ? '⌘' : 'Ctrl'
  })
  return label
}
