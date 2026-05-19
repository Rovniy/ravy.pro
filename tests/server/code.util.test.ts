import { describe, expect, it, vi } from 'vitest'

const getMock = vi.fn()
vi.mock('~~/server/utils/firebase-admin', () => ({
  SHORTLINKS_COLLECTION: 'shortlinks',
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: getMock,
      })),
    })),
  })),
}))

const codeFn = vi.fn()
vi.mock('nanoid', () => ({
  customAlphabet: vi.fn(() => codeFn),
}))

describe('server/utils/code', () => {
  it('returns first non-existing code', async () => {
    codeFn.mockReturnValueOnce('AAA111')
    getMock.mockResolvedValueOnce({ exists: false })
    const { generateUniqueCode } = await import('~~/server/utils/code')
    await expect(generateUniqueCode()).resolves.toBe('AAA111')
  })

  it('throws after max attempts collisions', async () => {
    codeFn.mockReturnValue('COLLID')
    getMock.mockResolvedValue({ exists: true })
    const { generateUniqueCode } = await import('~~/server/utils/code')
    await expect(generateUniqueCode()).rejects.toMatchObject({ statusCode: 500 })
  })
})
