import { describe, expect, it, vi } from 'vitest'

// Exercises the REAL requireToolAccess guard (not the pure decideToolAccess) to
// prove cross-tool isolation end-to-end: a grant for one tool never leaks into
// another, and admin bypasses the grant store.
const requireUserMock = vi.fn(async () => ({ uid: 'u1', email: 'user@test.dev' }))
vi.mock('~~/server/utils/auth', () => ({
  requireUser: requireUserMock,
}))

const grantGet = vi.fn()
vi.mock('~~/server/utils/firebase-admin', () => ({
  getAdminAuth: vi.fn(),
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({ get: grantGet })),
    })),
  })),
}))

function stubConfig() {
  vi.stubGlobal('useRuntimeConfig', () => ({ shortifyAdminEmail: 'admin@test.dev' }))
}

describe('requireToolAccess — cross-tool isolation', () => {
  it('denies a user granted shortify when they hit contract-scanner', async () => {
    stubConfig()
    requireUserMock.mockResolvedValueOnce({ uid: 'u1', email: 'user@test.dev' })
    grantGet.mockResolvedValueOnce({ exists: true, data: () => ({ tools: ['shortify'] }) })
    const { requireToolAccess } = await import('~~/server/utils/access')
    await expect(requireToolAccess({} as never, 'contract-scanner')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows the exact tool that was granted', async () => {
    stubConfig()
    requireUserMock.mockResolvedValueOnce({ uid: 'u1', email: 'user@test.dev' })
    grantGet.mockResolvedValueOnce({ exists: true, data: () => ({ tools: ['shortify'] }) })
    const { requireToolAccess } = await import('~~/server/utils/access')
    await expect(requireToolAccess({} as never, 'shortify')).resolves.toMatchObject({ uid: 'u1' })
  })

  it('denies a user with no grant at all', async () => {
    stubConfig()
    requireUserMock.mockResolvedValueOnce({ uid: 'u2', email: 'nobody@test.dev' })
    grantGet.mockResolvedValueOnce({ exists: false, data: () => ({}) })
    const { requireToolAccess } = await import('~~/server/utils/access')
    await expect(requireToolAccess({} as never, 'shortify')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('admin bypasses the grant store for any tool', async () => {
    stubConfig()
    requireUserMock.mockResolvedValueOnce({ uid: 'admin', email: 'admin@test.dev' })
    // grantGet intentionally not set — admin must not need a grant doc.
    const { requireToolAccess } = await import('~~/server/utils/access')
    await expect(requireToolAccess({} as never, 'contract-scanner')).resolves.toMatchObject({ email: 'admin@test.dev' })
  })
})
