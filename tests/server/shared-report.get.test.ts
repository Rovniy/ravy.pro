import { describe, expect, it, vi } from 'vitest'

const shareGetMock = vi.fn()
const docGetMock = vi.fn()
const whereMock = vi.fn()

vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: shareGetMock,
      })),
    })),
  })),
}))

vi.mock('~~/server/utils/contract-scan', () => ({
  contractScanCollection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: docGetMock,
    })),
    where: whereMock,
  })),
}))

describe('GET /api/contract-scanner/shared/[shareId]', () => {
  it('returns shared report data by share mapping', async () => {
    vi.stubGlobal('getRouterParam', () => 'share-abc')
    shareGetMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({ scanId: 'scan-42' }),
    })
    docGetMock.mockResolvedValueOnce({
      id: 'scan-42',
      exists: true,
      data: () => ({
        isShared: true,
        status: 'done',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:01:00.000Z',
        result: { summary: 'ok' },
        inputPreview: 'must not be returned',
      }),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/shared/[shareId].get')

    const result = await handler({} as never)
    expect(result).toEqual({
      id: 'scan-42',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:01:00.000Z',
      result: { summary: 'ok' },
    })
    expect((result as Record<string, unknown>).inputPreview).toBeUndefined()
  })

  it('returns 404 when share not found', async () => {
    vi.stubGlobal('getRouterParam', () => 'missing-share')
    shareGetMock.mockResolvedValueOnce({ exists: false, data: () => ({}) })
    whereMock.mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn(async () => ({ empty: true, docs: [] })),
        }),
      }),
    })

    const { default: handler } = await import('~~/server/api/contract-scanner/shared/[shareId].get')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 404 })
  })
})
