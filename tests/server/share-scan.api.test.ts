import { describe, expect, it, vi } from 'vitest'

vi.mock('~~/server/utils/auth', () => ({
  requireAdminUser: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

vi.mock('~~/server/utils/access', () => ({
  requireToolAccess: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

const getMock = vi.fn()
const setMock = vi.fn(async () => {})
const shareSetMock = vi.fn(async () => {})

vi.mock('~~/server/utils/contract-scan', () => ({
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
  it('returns share id for completed owned scan', async () => {
    vi.stubGlobal('getRouterParam', () => 'scan-1')
    getMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ownerUid: 'admin-1', status: 'done', result: { summary: 'ok' } }),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id]/share.post')
    const result = await handler({} as never)
    expect(result).toEqual({ shareId: 'share-123' })
    expect(setMock).toHaveBeenCalled()
    expect(shareSetMock).toHaveBeenCalled()
  })
})
