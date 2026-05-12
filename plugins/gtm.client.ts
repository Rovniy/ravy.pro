import { GTM_LOADER_FN } from '~/data/gtm'

// GTM container script (~90 KB) is deferred off the critical path. Consent
// defaults still run synchronously in <head>, so any tag firing later
// already respects GCM v2 categories.
export default defineNuxtPlugin(() => {
  if (import.meta.server)
    return

  const load = () => {
    // eslint-disable-next-line no-eval
    ;(0, eval)(GTM_LOADER_FN)
  }

  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout: number }) => number)
    | undefined

  if (ric) {
    ric(load, { timeout: 4000 })
  }
  else {
    setTimeout(load, 2500)
  }
})
