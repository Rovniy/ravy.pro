import { describe, expect, it, vi } from 'vitest'

// The Steam result endpoint must refuse access to anyone without a valid signed
// token or a paid Stripe session (authorizeAuditAccess), even if they know the id.
const getRouterParamMock = vi.fn(() => 'audit-1')
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, getRouterParam: getRouterParamMock }
})

const authorizeMock = vi.fn(async () => false)
const getRecordMock = vi.fn(async () => null as unknown)
vi.mock('~~/server/utils/steam-audit', () => ({
  authorizeAuditAccess: authorizeMock,
  getAuditRecord: getRecordMock,
  toPublicRecord: vi.fn((id: string, data: Record<string, unknown>) => ({ id, ...data })),
}))

vi.mock('~~/server/utils/steam-audit-token', () => ({
  signAccessToken: vi.fn(async () => 'fresh-token'),
}))

describe('gET /api/steam-audit/[id] — authorization', () => {
  it('rejects a non-owner without token or session (403)', async () => {
    getRouterParamMock.mockReturnValueOnce('audit-1')
    vi.stubGlobal('useRuntimeConfig', () => ({ steamAuditTokenSecret: 's' }))
    authorizeMock.mockResolvedValueOnce(false)
    const { default: handler } = await import('~~/server/api/steam-audit/[id].get')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })
    expect(getRecordMock).not.toHaveBeenCalled()
  })

  it('returns the record + a fresh token when authorized', async () => {
    getRouterParamMock.mockReturnValueOnce('audit-1')
    vi.stubGlobal('useRuntimeConfig', () => ({ steamAuditTokenSecret: 's' }))
    authorizeMock.mockResolvedValueOnce(true)
    getRecordMock.mockResolvedValueOnce({ status: 'done', classification: {} })
    const { default: handler } = await import('~~/server/api/steam-audit/[id].get')
    const res = await handler({} as never) as { record: { id: string }, token: string }
    expect(res.token).toBe('fresh-token')
    expect(res.record.id).toBe('audit-1')
  })

  it('404 when authorized but the audit is missing', async () => {
    getRouterParamMock.mockReturnValueOnce('gone')
    vi.stubGlobal('useRuntimeConfig', () => ({ steamAuditTokenSecret: 's' }))
    authorizeMock.mockResolvedValueOnce(true)
    getRecordMock.mockResolvedValueOnce(null)
    const { default: handler } = await import('~~/server/api/steam-audit/[id].get')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })
})
