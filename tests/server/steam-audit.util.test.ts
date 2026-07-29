import { beforeEach, describe, expect, it, vi } from 'vitest'

// Free (comped) unlock + result authorisation for the Steam AI disclosure tool.

const getQueryMock = vi.fn(() => ({} as Record<string, string>))
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, getQuery: getQueryMock }
})

const getOptionalUserMock = vi.fn(async () => null as { uid: string, email: string } | null)
const isAdminEmailMock = vi.fn(() => false)
vi.mock('~~/server/utils/access', () => ({
  getOptionalUser: getOptionalUserMock,
  isAdminEmail: isAdminEmailMock,
}))

vi.mock('~~/server/utils/steam-audit-token', () => ({
  signAccessToken: vi.fn(async () => 'signed-token'),
  verifyAccessToken: vi.fn(async () => null),
}))

vi.mock('~~/server/utils/stripe', () => ({ getStripe: vi.fn() }))
vi.mock('~~/server/utils/email', () => ({ sendResultEmail: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: vi.fn(),
  reportServerEvent: vi.fn(),
}))

// One shared in-memory audit doc.
let stored: Record<string, unknown> = {}
const setMock = vi.fn(async (patch: Record<string, unknown>) => {
  stored = { ...stored, ...patch }
})
const getMock = vi.fn(async () => ({ exists: true, data: () => stored }))
vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({ doc: vi.fn(() => ({ get: getMock, set: setMock })) })),
  })),
  getAdminAuth: vi.fn(),
}))

const CONFIG = { openaiApiKey: 'k', resendApiKey: 'r', tokenSecret: 's' }

function awaitingAudit() {
  return {
    status: 'awaiting_payment',
    progress: 0,
    step: 'Awaiting payment',
    classification: { rulesetVersion: '1', perCategory: [], mustDisclose: false, hasPre: false, hasLive: false, hasGray: false },
    createdAt: 'c',
    updatedAt: 'u',
  }
}

describe('server/utils/steam-audit — comped unlock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stored = awaitingAudit()
    // Keep the fire-and-forget generation from hitting the network.
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ output_text: '{"preGeneratedText":"x"}' }),
    })) as never)
    vi.stubGlobal('useRuntimeConfig', () => ({ steamAuditTokenSecret: 's' }))
  })

  it('unlocks without a Stripe session and flags the record as comped', async () => {
    const { compAndGenerate } = await import('~~/server/utils/steam-audit')
    await compAndGenerate('audit-1', 'Admin@Test.dev', CONFIG)

    const patch = setMock.mock.calls[0]![0] as Record<string, unknown>
    expect(patch.status).toBe('paid')
    expect(patch.comped).toBe(true)
    expect(patch.stripeSessionId).toBeUndefined()
    expect(patch.customerEmail).toBe('admin@test.dev')
  })

  it('is idempotent — a second unlock does nothing', async () => {
    stored = { ...awaitingAudit(), status: 'done' }
    const { compAndGenerate } = await import('~~/server/utils/steam-audit')
    await compAndGenerate('audit-1', undefined, CONFIG)
    expect(setMock).not.toHaveBeenCalled()
  })
})

describe('server/utils/steam-audit — authorizeAuditAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stored = awaitingAudit()
    getQueryMock.mockReturnValue({})
    getOptionalUserMock.mockResolvedValue(null)
    isAdminEmailMock.mockReturnValue(false)
    vi.stubGlobal('useRuntimeConfig', () => ({ steamAuditTokenSecret: 's' }))
  })

  it('grants the admin access with no token and no payment', async () => {
    getOptionalUserMock.mockResolvedValue({ uid: 'admin-uid', email: 'admin@test.dev' })
    isAdminEmailMock.mockReturnValue(true)
    const { authorizeAuditAccess } = await import('~~/server/utils/steam-audit')
    expect(await authorizeAuditAccess({} as never, 'audit-1')).toBe(true)
  })

  it('refuses a signed-in stranger', async () => {
    getOptionalUserMock.mockResolvedValue({ uid: 'other-uid', email: 'other@test.dev' })
    stored = { ...awaitingAudit(), status: 'done', ownerUid: 'owner-uid' }
    const { authorizeAuditAccess } = await import('~~/server/utils/steam-audit')
    expect(await authorizeAuditAccess({} as never, 'audit-1')).toBe(false)
  })

  it('grants the owner access once the audit is unlocked', async () => {
    getOptionalUserMock.mockResolvedValue({ uid: 'owner-uid', email: 'owner@test.dev' })
    stored = { ...awaitingAudit(), status: 'done', ownerUid: 'owner-uid' }
    const { authorizeAuditAccess } = await import('~~/server/utils/steam-audit')
    expect(await authorizeAuditAccess({} as never, 'audit-1')).toBe(true)
  })

  it('refuses the owner while the audit is still awaiting payment', async () => {
    getOptionalUserMock.mockResolvedValue({ uid: 'owner-uid', email: 'owner@test.dev' })
    stored = { ...awaitingAudit(), ownerUid: 'owner-uid' }
    const { authorizeAuditAccess } = await import('~~/server/utils/steam-audit')
    expect(await authorizeAuditAccess({} as never, 'audit-1')).toBe(false)
  })
})
