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

vi.mock('~~/server/utils/pdf-text', () => ({
  extractPdfTextFromBase64: vi.fn(async () => 'pdf text'),
}))

describe('extract-text api', () => {
  it('returns 400 when file payload missing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ openaiApiKey: 'k' }))
    readBodyMock.mockResolvedValueOnce({})
    const { default: handler } = await import('~~/server/api/contract-scanner/extract-text.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 for unsupported file type', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ openaiApiKey: 'k' }))
    readBodyMock.mockResolvedValueOnce({
      fileMime: 'text/plain',
      fileBase64: 'abc',
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/extract-text.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })
})
