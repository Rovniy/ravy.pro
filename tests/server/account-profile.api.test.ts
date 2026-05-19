import { describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return {
    ...mod,
    readBody: readBodyMock,
  }
})

const getMock = vi.fn()
const setMock = vi.fn(async () => {})
vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: getMock,
        set: setMock,
      })),
    })),
  })),
}))

vi.mock('~~/server/utils/auth', () => ({
  requireUser: vi.fn(async () => ({ uid: 'u1', email: 'u@test.dev' })),
}))

describe('account profile api', () => {
  it('GET returns en by default', async () => {
    getMock.mockResolvedValueOnce({ exists: false, data: () => ({}) })
    const { default: handler } = await import('~~/server/api/account/profile.get')
    await expect(handler({} as never)).resolves.toEqual({ language: 'en' })
  })

  it('POST rejects unsupported language', async () => {
    readBodyMock.mockResolvedValueOnce({ language: 'de' })
    const { default: handler } = await import('~~/server/api/account/profile.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
