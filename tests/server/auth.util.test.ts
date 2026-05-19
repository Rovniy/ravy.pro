import { describe, expect, it, vi } from 'vitest'

vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return {
    ...mod,
    getRequestHeader: vi.fn(() => 'Bearer token'),
  }
})

const verifyIdTokenMock = vi.fn()
vi.mock('~~/server/utils/firebase-admin', () => ({
  getAdminAuth: vi.fn(() => ({
    verifyIdToken: verifyIdTokenMock,
  })),
}))

describe('server/utils/auth', () => {
  it('requireUser returns uid/email for verified token', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({
      uid: 'u1',
      email: 'USER@EXAMPLE.COM',
      email_verified: true,
    })
    const { requireUser } = await import('~~/server/utils/auth')
    const user = await requireUser({} as never)
    expect(user).toEqual({ uid: 'u1', email: 'user@example.com' })
  })

  it('requireAdminUser rejects non-admin', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({
      uid: 'u1',
      email: 'user@example.com',
      email_verified: true,
    })
    vi.stubGlobal('useRuntimeConfig', () => ({ shortifyAdminEmail: 'admin@example.com' }))
    const { requireAdminUser } = await import('~~/server/utils/auth')
    await expect(requireAdminUser({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })
})
