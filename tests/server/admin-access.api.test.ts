import { describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, readBody: readBodyMock }
})

vi.mock('~~/server/utils/auth', () => ({
  requireAdminUser: vi.fn(async () => ({ uid: 'admin-1', email: 'admin@test.dev' })),
}))

const grantGet = vi.fn(async () => ({ exists: true, data: () => ({ tools: ['shortify'] }) }))
const grantSet = vi.fn(async () => {})
const grantDelete = vi.fn(async () => {})
vi.mock('~~/server/utils/access', () => ({
  accessCollection: vi.fn(() => ({
    doc: vi.fn(() => ({ get: grantGet, set: grantSet, delete: grantDelete })),
  })),
}))

const auditAdd = vi.fn(async () => {})
vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({ collection: vi.fn(() => ({ add: auditAdd })) })),
}))

describe('admin access grant + audit log', () => {
  it('grant: normalizes email, filters unknown keys, and logs old/new + admin', async () => {
    // 'contract-scanner' is no longer a gated tool, so it is filtered out
    // alongside the bogus key — only 'shortify' survives.
    readBodyMock.mockResolvedValueOnce({ email: 'User@Example.com', tools: ['shortify', 'contract-scanner', 'bogus'] })
    const { default: handler } = await import('~~/server/api/admin/access.post')

    const res = await handler({} as never)

    expect(res).toEqual({ email: 'user@example.com', tools: ['shortify'] })
    expect(grantSet).toHaveBeenCalled()
    expect(auditAdd).toHaveBeenCalledWith(expect.objectContaining({
      action: 'set',
      targetEmail: 'user@example.com',
      oldTools: ['shortify'],
      newTools: ['shortify'],
      adminEmail: 'admin@test.dev',
      adminUid: 'admin-1',
    }))
  })

  it('revoke: empty tools deletes the grant and logs a revoke', async () => {
    readBodyMock.mockResolvedValueOnce({ email: 'user@example.com', tools: [] })
    const { default: handler } = await import('~~/server/api/admin/access.post')

    await handler({} as never)

    expect(grantDelete).toHaveBeenCalled()
    expect(auditAdd).toHaveBeenCalledWith(expect.objectContaining({ action: 'revoke', newTools: [] }))
  })

  it('rejects an invalid email', async () => {
    readBodyMock.mockResolvedValueOnce({ email: 'not-an-email', tools: [] })
    const { default: handler } = await import('~~/server/api/admin/access.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
