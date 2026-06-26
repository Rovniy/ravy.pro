import { describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return {
    ...mod,
    readBody: readBodyMock,
  }
})

vi.mock('~~/server/utils/auth', () => ({
  requireAdminUser: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

vi.mock('~~/server/utils/access', () => ({
  requireToolAccess: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: vi.fn(async () => {}),
  clientIdentity: vi.fn(() => 'test-ip'),
}))

vi.mock('~~/server/utils/code', () => ({
  generateUniqueCode: vi.fn(async () => 'abc123'),
}))

const getMock = vi.fn()
const setMock = vi.fn(async () => {})

vi.mock('~~/server/utils/firebase-admin', () => ({
  SHORTLINKS_COLLECTION: 'shortlinks',
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: setMock,
        get: getMock,
      })),
      where: vi.fn(() => ({
        get: vi.fn(async () => ({
          docs: [{
            id: 'abc123',
            data: () => ({
              url: 'https://example.com',
              clicks: 1,
              createdAt: { toDate: () => new Date('2026-01-01T00:00:00.000Z'), toMillis: () => 0 },
              lastClickedAt: null,
            }),
          }],
        })),
      })),
    })),
  })),
}))

describe('shortify api', () => {
  it('pOST rejects when url is missing', async () => {
    readBodyMock.mockResolvedValueOnce({})
    const { default: handler } = await import('~~/server/api/shortify/links.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('gET returns links list', async () => {
    const { default: handler } = await import('~~/server/api/shortify/links.get')
    const list = await handler({} as never)
    expect(list[0]).toMatchObject({ code: 'abc123', url: 'https://example.com', clicks: 1 })
  })
})
