// Single source of truth for analytics event names + tool identifiers.
//
// Events are pushed to `window.dataLayer` (see composables/useAnalytics.ts) and
// forwarded to GA4 by GTM (`GTM-57T2XCRL`, see data/gtm.ts). Firing is gated by
// GCM v2 Consent Mode — GTM only forwards to GA4 once `analytics_storage` is
// granted, so app code never needs to check consent itself.
//
// Naming follows GA4 conventions (snake_case). `begin_checkout`, `purchase`,
// `login` and `logout` are GA4 standard events so the built-in funnel and
// monetization reports work out of the box; everything else is custom.

export const EVENTS = {
  // Tools
  TOOL_VIEW: 'tool_view',
  TOOL_ACTION: 'tool_action',
  TOOL_DOWNLOAD: 'tool_download',
  TOOL_ERROR: 'tool_error',

  // Blog
  BLOG_VIEW: 'blog_view',
  BLOG_READ_PROGRESS: 'blog_read_progress',
  BLOG_COMPLETE: 'blog_complete',
  BLOG_FILTER: 'blog_filter',
  BLOG_SEARCH: 'blog_search',

  // Navigation & links
  OUTBOUND_CLICK: 'outbound_click',
  NAV_CLICK: 'nav_click',
  CTA_CLICK: 'cta_click',

  // Conversions
  NEWSLETTER_SUBSCRIBE: 'newsletter_subscribe',
  CONTACT_CLICK: 'contact_click',
  LOGIN: 'login',
  LOGOUT: 'logout',

  // Paid funnels (Steam AI disclosure, Contract scanner)
  SCAN_START: 'scan_start',
  SCAN_SUBMIT: 'scan_submit',
  SCAN_RESULT: 'scan_result',
  PAYWALL_VIEW: 'paywall_view',
  BEGIN_CHECKOUT: 'begin_checkout',
  PURCHASE: 'purchase',
} as const

export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS]

// Stable tool identifiers used as the `tool_id` param across every tool event.
// Keep these short and decoupled from the URL slug so funnels stay stable even
// if a route changes.
export type ToolId
  = | 'qr-code'
    | 'credit-card'
    | 'jwt-decoder'
    | 'image-converter'
    | 'steam-ai-disclosure'
    | 'contract-scanner'

// Maps a tool page path (e.g. '/tools/qr-code-generator') to its ToolId.
// Used by the auto `tool_view` hook in useToolPageSchema(). Returns null for
// non-tool / unknown paths so callers can skip emitting.
export function toolIdFromPath(path: string): ToolId | null {
  const p = path.split('?')[0].replace(/\/+$/, '')
  if (p.includes('/tools/qr-code-generator'))
    return 'qr-code'
  if (p.includes('/tools/credit-card-generator'))
    return 'credit-card'
  if (p.includes('/tools/jwt-decoder'))
    return 'jwt-decoder'
  if (p.includes('/tools/image-converter'))
    return 'image-converter'
  if (p.includes('/tools/steam-ai-disclosure'))
    return 'steam-ai-disclosure'
  if (p.includes('/tools/contract-red-flag-scanner'))
    return 'contract-scanner'
  return null
}
