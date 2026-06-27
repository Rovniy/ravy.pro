// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { useAnalytics } from '../../composables/useAnalytics'
import { EVENTS, toolIdFromPath } from '../../data/analytics'

// --- toolIdFromPath --------------------------------------------------------

describe('toolIdFromPath', () => {
  it('maps each tool page path to its stable id', () => {
    expect(toolIdFromPath('/tools/qr-code-generator')).toBe('qr-code')
    expect(toolIdFromPath('/tools/credit-card-generator')).toBe('credit-card')
    expect(toolIdFromPath('/tools/jwt-decoder')).toBe('jwt-decoder')
    expect(toolIdFromPath('/tools/image-converter')).toBe('image-converter')
    expect(toolIdFromPath('/tools/steam-ai-disclosure')).toBe('steam-ai-disclosure')
    expect(toolIdFromPath('/tools/contract-red-flag-scanner')).toBe('contract-scanner')
  })

  it('ignores trailing slashes, query strings, and nested paths', () => {
    expect(toolIdFromPath('/tools/qr-code-generator/')).toBe('qr-code')
    expect(toolIdFromPath('/tools/jwt-decoder?token=abc')).toBe('jwt-decoder')
    expect(toolIdFromPath('/tools/contract-red-flag-scanner/result/123')).toBe('contract-scanner')
  })

  it('returns null for non-tool / unknown paths', () => {
    expect(toolIdFromPath('/blogs/my-post')).toBeNull()
    expect(toolIdFromPath('/tools/does-not-exist')).toBeNull()
    expect(toolIdFromPath('/')).toBeNull()
  })
})

// --- useAnalytics ----------------------------------------------------------

describe('useAnalytics', () => {
  beforeEach(() => {
    window.dataLayer = []
  })

  it('creates dataLayer if absent and pushes the event with params', () => {
    delete (window as any).dataLayer
    const { track } = useAnalytics()
    track(EVENTS.TOOL_VIEW, { tool_id: 'qr-code' })
    expect(window.dataLayer).toEqual([{ event: 'tool_view', tool_id: 'qr-code' }])
  })

  it('shapes tool_action via trackTool', () => {
    const { trackTool } = useAnalytics()
    trackTool('credit-card', 'generate', { count: 5 })
    expect(window.dataLayer!.at(-1)).toEqual({
      event: 'tool_action',
      tool_id: 'credit-card',
      action: 'generate',
      count: 5,
    })
  })

  it('shapes a GA4 purchase with uppercased currency and an items array', () => {
    const { trackPurchase } = useAnalytics()
    trackPurchase({ transactionId: 'cs_test_1', value: 10, currency: 'usd', item: 'contract-scanner' })
    expect(window.dataLayer!.at(-1)).toEqual({
      event: 'purchase',
      transaction_id: 'cs_test_1',
      value: 10,
      currency: 'USD',
      items: [{ item_id: 'contract-scanner', item_name: 'contract-scanner', price: 10, quantity: 1 }],
    })
  })

  it('derives the link domain for outbound clicks', () => {
    const { trackOutbound } = useAnalytics()
    trackOutbound('https://t.me/xploitravy', { link_text: 'Telegram', location: '/' })
    expect(window.dataLayer!.at(-1)).toMatchObject({
      event: 'outbound_click',
      link_url: 'https://t.me/xploitravy',
      link_domain: 't.me',
      link_text: 'Telegram',
      location: '/',
    })
  })
})
