import type { AnalyticsEvent, ToolId } from '~/data/analytics'
import { EVENTS } from '~/data/analytics'

// Thin wrapper over GTM's dataLayer. Every event the site emits goes through
// `track()`. GTM (data/gtm.ts) forwards to GA4 and applies GCM v2 consent, so
// this layer stays consent-agnostic and SSR-safe — see CLAUDE.md → Analytics.

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

type Params = Record<string, unknown>

function push(payload: Record<string, unknown>) {
  // No-op on the server and before GTM bootstraps the array (mirrors the guard
  // in composables/useCookieConsent.ts). dataLayer is created in the inline
  // consent script in <head>, so it normally exists by the time we run.
  if (typeof window === 'undefined')
    return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)
}

export function useAnalytics() {
  function track(event: AnalyticsEvent, params: Params = {}) {
    push({ event, ...params })
  }

  function trackTool(toolId: ToolId, action: string, params: Params = {}) {
    track(EVENTS.TOOL_ACTION, { tool_id: toolId, action, ...params })
  }

  function trackDownload(toolId: ToolId, params: Params = {}) {
    track(EVENTS.TOOL_DOWNLOAD, { tool_id: toolId, ...params })
  }

  function trackToolError(toolId: ToolId, action: string, message?: string) {
    track(EVENTS.TOOL_ERROR, { tool_id: toolId, action, ...(message ? { message } : {}) })
  }

  function trackOutbound(url: string, ctx: { link_text?: string, location?: string } = {}) {
    let domain = ''
    try {
      domain = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined).hostname
    }
    catch {
      domain = ''
    }
    track(EVENTS.OUTBOUND_CLICK, {
      link_url: url,
      link_domain: domain,
      ...(ctx.link_text ? { link_text: ctx.link_text } : {}),
      ...(ctx.location ? { location: ctx.location } : {}),
    })
  }

  function trackCta(ctaId: string, location: string) {
    track(EVENTS.CTA_CLICK, { cta_id: ctaId, location })
  }

  function trackPurchase(opts: {
    transactionId: string
    value: number
    currency?: string
    item?: string
  }) {
    track(EVENTS.PURCHASE, {
      transaction_id: opts.transactionId,
      value: opts.value,
      currency: (opts.currency || 'USD').toUpperCase(),
      ...(opts.item
        ? { items: [{ item_id: opts.item, item_name: opts.item, price: opts.value, quantity: 1 }] }
        : {}),
    })
  }

  return {
    track,
    trackTool,
    trackDownload,
    trackToolError,
    trackOutbound,
    trackCta,
    trackPurchase,
  }
}
