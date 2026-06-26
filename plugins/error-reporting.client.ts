// Captures uncaught browser errors and ships them to /api/client-error (which
// forwards them to Cloud Error Reporting). Production-only, deduped + throttled,
// and sends no PII — just message / stack / source / url.
export default defineNuxtPlugin((nuxtApp) => {
  if (import.meta.dev)
    return

  const seen = new Set<string>()
  const MAX_DISTINCT = 200
  const MAX_PER_WINDOW = 10
  let sentInWindow = 0
  setInterval(() => {
    sentInWindow = 0
  }, 60_000)

  function send(message: string, stack: string | undefined, source: string) {
    const key = `${source}:${message}`.slice(0, 200)
    if (seen.has(key) || sentInWindow >= MAX_PER_WINDOW)
      return
    if (seen.size < MAX_DISTINCT)
      seen.add(key)
    sentInWindow += 1

    try {
      const body = JSON.stringify({
        message: message.slice(0, 500),
        stack: stack?.slice(0, 4000),
        source,
        url: location.href,
      })
      // keepalive lets the report survive a navigation/unload.
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
    catch {
      // Never let error reporting throw.
    }
  }

  nuxtApp.hook('vue:error', (error) => {
    const e = error as Error
    send(e?.message || String(error), e?.stack, 'vue')
  })

  window.addEventListener('error', (ev) => {
    send(ev.message || 'window error', (ev.error as Error | undefined)?.stack, 'window')
  })

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason as { message?: string, stack?: string } | undefined
    send(reason?.message || String(ev.reason) || 'unhandled rejection', reason?.stack, 'promise')
  })
})
