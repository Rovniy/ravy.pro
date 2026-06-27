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
  requireAdminUser: vi.fn(async () => ({ uid: 'admin-1', email: 'admin@test.dev' })),
}))

vi.mock('~~/server/utils/access', () => ({
  // Public endpoint now: anonymous scan (no signed-in owner).
  getOptionalUser: vi.fn(async () => null),
}))

vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: vi.fn(async () => {}),
  clientIdentity: vi.fn(() => 'test-ip'),
}))

const setMock = vi.fn(async () => {})
const docMock = vi.fn(() => ({ id: 'scan-1', set: setMock }))

const processContractScanMock = vi.fn(async () => {})
vi.mock('~~/server/utils/contract-scan', () => ({
  contractScanCollection: vi.fn(() => ({ doc: docMock })),
  processContractScan: processContractScanMock,
}))

vi.mock('~~/server/utils/pdf-text', () => ({
  extractPdfTextFromBase64: vi.fn(async () => 'extracted text from pdf with enough length'),
}))

describe('pOST /api/contract-scanner/scans', () => {
  it('returns 400 when text is too short', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ openaiApiKey: 'k' }))
    readBodyMock.mockResolvedValueOnce({ text: 'tiny' })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans.post')

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('returns 413 when text is too long', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ openaiApiKey: 'k' }))
    readBodyMock.mockResolvedValueOnce({ text: 'a'.repeat(100_001) })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans.post')

    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 413 })
  })

  it('creates queued scan and triggers async processing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ openaiApiKey: 'test-key' }))
    readBodyMock.mockResolvedValueOnce({
      text: 'This is a valid contract text with more than thirty characters for test.',
      fileName: 'contract.txt',
      responseLanguage: 'ru',
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans.post')

    const result = await handler({} as never)
    expect(result).toMatchObject({
      id: 'scan-1',
      status: 'queued',
      progress: 5,
    })
    expect(setMock).toHaveBeenCalledTimes(1)
    expect(processContractScanMock).toHaveBeenCalledWith(
      'scan-1',
      expect.stringContaining('valid contract text'),
      'test-key',
      'ru',
    )
  })
})
