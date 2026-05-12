import type { ConsentCategory, ConsentState } from '~/data/gtm'
import { CONSENT_DEFAULTS, CONSENT_STORAGE_KEY } from '~/data/gtm'

interface StoredConsent {
  state: ConsentState
  version: number
  decidedAt: string
}

const STORAGE_VERSION = 1

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function gtagUpdate(state: ConsentState) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function')
    return
  window.gtag('consent', 'update', state)
}

function readStored(): StoredConsent | null {
  if (typeof window === 'undefined')
    return null
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw)
      return null
    const parsed = JSON.parse(raw) as StoredConsent
    if (parsed.version !== STORAGE_VERSION)
      return null
    return parsed
  }
  catch {
    return null
  }
}

function writeStored(state: ConsentState) {
  if (typeof window === 'undefined')
    return
  const payload: StoredConsent = {
    state,
    version: STORAGE_VERSION,
    decidedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload))
}

export function useCookieConsent() {
  const decided = useState<boolean>('consent:decided', () => false)
  const state = useState<ConsentState>('consent:state', () => ({ ...CONSENT_DEFAULTS }))

  function hydrate() {
    const stored = readStored()
    if (!stored) {
      decided.value = false
      return
    }
    state.value = { ...CONSENT_DEFAULTS, ...stored.state }
    decided.value = true
    gtagUpdate(state.value)
  }

  function commit(next?: Partial<ConsentState>) {
    state.value = { ...CONSENT_DEFAULTS, ...state.value, ...(next ?? {}) }
    writeStored(state.value)
    gtagUpdate(state.value)
    decided.value = true
  }

  function acceptAll() {
    const all: ConsentState = (Object.keys(CONSENT_DEFAULTS) as ConsentCategory[])
      .reduce((acc, key) => ({ ...acc, [key]: 'granted' }), {} as ConsentState)
    commit(all)
  }

  function rejectAll() {
    commit({ ...CONSENT_DEFAULTS })
  }

  // Updates in-memory state only — does NOT persist or mark as decided.
  // Use this for live toggles in the customize panel; call `commit()` to save.
  function setPending(cat: ConsentCategory, granted: boolean) {
    state.value = { ...state.value, [cat]: granted ? 'granted' : 'denied' }
  }

  function reopen() {
    decided.value = false
  }

  return {
    decided: readonly(decided),
    state: readonly(state),
    hydrate,
    acceptAll,
    rejectAll,
    setPending,
    commit,
    reopen,
  }
}
