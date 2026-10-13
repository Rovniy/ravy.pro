import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/**
 * Warns before unsaved studio edits are thrown away — by closing the tab, a
 * reload, or an in-app navigation (on a phone, a swipe back). Both editors are
 * used from a phone, where that swipe is one stray gesture away.
 */
export function useUnsavedGuard(dirty: Ref<boolean>) {
  useEventListener(globalThis.window, 'beforeunload', (e: BeforeUnloadEvent) => {
    if (dirty.value)
      e.preventDefault()
  })

  onBeforeRouteLeave(() => {
    // eslint-disable-next-line no-alert
    if (dirty.value && !globalThis.confirm('You have unsaved changes. Leave anyway?'))
      return false
  })
}
