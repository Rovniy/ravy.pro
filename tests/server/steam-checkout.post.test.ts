import { beforeEach, describe, expect, it, vi } from 'vitest'

// The admin runs the Steam AI disclosure for free: no Stripe session is created,
// the audit is comped, and the response points straight at the result page.
// Everyone else must still go through checkout.

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, readBody: readBodyMock }
})

const getOptionalUserMock = vi.fn(async () => null as { uid: string, email: string } | null)
const isAdminEmailMock = vi.fn(() => false)
vi.mock('~~/server/utils/access', () => ({
  getOptionalUser: getOptionalUserMock,
  isAdminEmail: isAdminEmailMock,
}))

vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: vi.fn(async () => {}),
  clientIdentity: vi.fn(() => 'test-ip'),
}))

const setMock = vi.fn(async () => {})
const compAndGenerateMock = vi.fn(async () => {})
vi.mock('~~/server/utils/steam-audit', () => ({
  steamAuditCollection: vi.fn(() => ({ doc: vi.fn(() => ({ id: 'audit-1', set: setMock })) })),
  compAndGenerate: compAndGenerateMock,
}))

vi.mock('~~/server/utils/steam-audit-token', () => ({
  signAccessToken: vi.fn(async () => 'signed-token'),
}))

const sessionsCreateMock = vi.fn(async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.com/x' }))
vi.mock('~~/server/utils/stripe', () => ({
  getStripe: vi.fn(() => ({ checkout: { sessions: { create: sessionsCreateMock } } })),
}))

const ANSWERS = { art: 'shipped_pre' }

function stubConfig(extra: Record<string, unknown> = {}) {
  vi.stubGlobal('useRuntimeConfig', () => ({
    stripeSecretKey: 'sk_test',
    stripePriceId: 'price_1',
    openaiApiKey: 'oai',
    resendApiKey: 'resend',
    steamAuditTokenSecret: 'secret',
    ...extra,
  }))
}

async function loadHandler() {
  const { default: handler } = await import('~~/server/api/steam-audit/checkout.post')
  return handler
}

describe('pOST /api/steam-audit/checkout — admin free access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getOptionalUserMock.mockResolvedValue(null)
    isAdminEmailMock.mockReturnValue(false)
  })

  it('skips Stripe and comps the audit for the signed-in admin', async () => {
    stubConfig()
    getOptionalUserMock.mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.dev' })
    isAdminEmailMock.mockReturnValue(true)
    readBodyMock.mockResolvedValueOnce({ answers: ANSWERS, gameName: 'Tiny Boo' })

    const res = await (await loadHandler())({} as never) as { id: string, url: string, free?: boolean }

    expect(sessionsCreateMock).not.toHaveBeenCalled()
    expect(compAndGenerateMock).toHaveBeenCalledWith('audit-1', 'admin@test.dev', expect.objectContaining({
      openaiApiKey: 'oai',
      tokenSecret: 'secret',
    }))
    expect(res.free).toBe(true)
    expect(res.url).toBe('/tools/steam-ai-disclosure/result/audit-1?t=signed-token')
  })

  it('works for the admin even when Stripe is not configured', async () => {
    stubConfig({ stripeSecretKey: '', stripePriceId: '' })
    getOptionalUserMock.mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.dev' })
    isAdminEmailMock.mockReturnValue(true)
    readBodyMock.mockResolvedValueOnce({ answers: ANSWERS })

    const res = await (await loadHandler())({} as never) as { free?: boolean }
    expect(res.free).toBe(true)
  })

  it('still charges a signed-in non-admin through Stripe', async () => {
    stubConfig()
    getOptionalUserMock.mockResolvedValue({ uid: 'user-uid', email: 'user@test.dev' })
    isAdminEmailMock.mockReturnValue(false)
    readBodyMock.mockResolvedValueOnce({ answers: ANSWERS })

    const res = await (await loadHandler())({} as never) as { url: string, free?: boolean }

    expect(compAndGenerateMock).not.toHaveBeenCalled()
    expect(sessionsCreateMock).toHaveBeenCalledTimes(1)
    expect(res.url).toBe('https://checkout.stripe.com/x')
    expect(res.free).toBeUndefined()
  })

  it('rejects an anonymous checkout when payments are unconfigured', async () => {
    stubConfig({ stripeSecretKey: '' })
    readBodyMock.mockResolvedValueOnce({ answers: ANSWERS })

    await expect((await loadHandler())({} as never)).rejects.toMatchObject({ statusCode: 500 })
  })
})
