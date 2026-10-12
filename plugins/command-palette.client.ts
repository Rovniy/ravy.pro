// Global shortcuts for the ⌘K palette: ⌘K / Ctrl+K toggles it from anywhere
// (including inside inputs, the way every palette behaves), and "/" opens it
// when focus is not in something you type into. The palette chunk itself is
// prefetched on idle so the first open does not wait on the network.

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el)
    return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export default defineNuxtPlugin(() => {
  const palette = useCommandPalette()

  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.isComposing)
      return
    // `e.code` so the shortcut also works on a Russian layout, where K is Л.
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.code === 'KeyK') {
      e.preventDefault()
      palette.toggle('shortcut')
      return
    }
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(e.target) && !palette.isOpen.value) {
      e.preventDefault()
      palette.open('shortcut')
    }
  })

  const prefetch = () => import('~/components/command/Palette.vue').catch(() => {})
  if ('requestIdleCallback' in window)
    window.requestIdleCallback(prefetch, { timeout: 4000 })
  else
    setTimeout(prefetch, 2500)
})
