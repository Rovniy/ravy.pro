import { describe, expect, it, vi } from 'vitest'

vi.mock('~~/server/utils/auth', () => ({
  requireAdminUser: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

vi.mock('~~/server/utils/access', () => ({
  requireToolAccess: vi.fn(async () => ({ uid: 'admin-1', email: 'a@test.dev' })),
}))

const getMock = vi.fn()
const whereMock = vi.fn()
const setMock = vi.fn(async () => {})

vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: setMock,
      })),
    })),
  })),
}))

vi.mock('~~/server/utils/contract-scan', () => ({
  contractScanCollection: vi.fn(() => ({
    where: whereMock,
    doc: vi.fn(() => ({ get: getMock, set: setMock })),
  })),
}))

describe('contract scan read/share apis', () => {
  it('gET /scans returns owner list', async () => {
    vi.stubGlobal('getQuery', () => ({ limit: '10' }))
    whereMock.mockReturnValueOnce({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(async () => ({
            docs: [{ id: 's1', data: () => ({ ownerUid: 'admin-1', status: 'done' }) }],
          })),
        })),
      })),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans.get')
    const result = await handler({} as never)
    expect(result[0]).toMatchObject({ id: 's1', status: 'done' })
  })

  it('gET /scans/[id] rejects чужой scan', async () => {
    vi.stubGlobal('getRouterParam', () => 'scan-foreign')
    getMock.mockResolvedValueOnce({
      exists: true,
      id: 'scan-foreign',
      data: () => ({ ownerUid: 'someone-else' }),
    })
    const { default: handler } = await import('~~/server/api/contract-scanner/scans/[id].get')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 403 })
  })
})
