import { useAnalytics } from '~/composables/useAnalytics'

// Auto-captures clicks on outbound links (different host, or mailto:/tel:) via
// a single delegated listener on the document. This covers every external link
// — social networks, Telegram, email — without instrumenting each component.
// Internal navigation is tracked explicitly (nav_click/cta_click) where it
// matters. SPA page_view is handled by GTM's History Change trigger.
export default defineNuxtPlugin(() => {
  if (import.meta.server)
    return

  const { trackOutbound } = useAnalytics()

  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as Element | null
      const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor)
        return

      const href = anchor.getAttribute('href') || ''
      if (!href || href.startsWith('#'))
        return

      const isMailOrTel = /^(?:mailto:|tel:)/i.test(href)
      let isExternal = isMailOrTel
      if (!isExternal) {
        try {
          isExternal = new URL(anchor.href, window.location.href).hostname !== window.location.hostname
        }
        catch {
          isExternal = false
        }
      }
      if (!isExternal)
        return

      trackOutbound(isMailOrTel ? href : anchor.href, {
        link_text: (anchor.textContent || '').trim().slice(0, 100) || undefined,
        location: window.location.pathname,
      })
    },
    { capture: true },
  )
})
