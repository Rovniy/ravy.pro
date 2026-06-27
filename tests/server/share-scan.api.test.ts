import { describe, expect, it, vi } from 'vitest'

const getRouterParamMock = vi.fn(() => 'scan-1')
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, getRouterParam: getRouterParamMock }
})

const getMock = vi.fn()
const setMock = vi.fn(async () => {})
const shareSetMock = vi.fn(async () => {})
const authorizeMock = vi.fn(async () => true)

vi.mock('~~/server/utils/contract-scan', () => ({
  authorizeContractScanAccess: authorizeMock,
  contractScanCollection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: getMock,
      set: setMock,
    })),
  })),
}))

vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: shareSetMock,
      })),
    })),
  })),
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'share-123'),
}))

describe('pOST /contract-scanner/scans/[id]/share', () => {
  it('returns a share id for a paid, completed scan', async () => {
    getRouterParamMock.mockReturnValueOnce('scan-1')
    authorizeMock.mockResolvedValueOnce(true)
    getMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerUid: 'admin-1', status: 'done', paid: true, result: { summary: 'ok' } }),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id]/share.post')
    const result = await handler({} as never)
    expect(result).toEqual({ shareId: 'share-123' })
    expect(setMock).toHaveBeenCalled()
    expect(shareSetMock).toHaveBeenCalled()
  })

  it('rejects sharing an unpaid scan with 402', async () => {
    getRouterParamMock.mockReturnValueOnce('scan-2')
    authorizeMock.mockResolvedValueOnce(true)
    getMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerUid: 'admin-1', status: 'done', paid: false, result: { summary: 'ok' } }),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id]/share.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 402 })
  })

  it('rejects an unauthorized caller with 403', async () => {
    getRouterParamMock.mockReturnValueOnce('scan-3')
    authorizeMock.mockResolvedValueOnce(false)
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id]/share.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })
})
