import { loadGtm } from '~/data/gtm'

// GTM container script (~90 KB) is deferred off the critical path. Consent
// defaults still run synchronously in <head>, so any tag firing later
// already respects GCM v2 categories.
export default defineNuxtPlugin(() => {
  if (import.meta.server)
    return

  const ric = (window as unknown as {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  }).requestIdleCallback

  if (ric) {
    ric(loadGtm, { timeout: 4000 })
  }
  else {
    setTimeout(loadGtm, 2500)
  }
})
