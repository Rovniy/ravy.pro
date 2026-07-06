import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TOOL_IDS } from '~~/data/analytics'

const readBodyMock = vi.fn()
const setResponseHeaderMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, readBody: readBodyMock, setResponseHeader: setResponseHeaderMock }
})

const assertRateLimitMock = vi.fn(async () => {})
vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: assertRateLimitMock,
  clientIdentity: vi.fn(() => 'test-ip'),
}))

vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: vi.fn(),
  reportServerEvent: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'server-ts' },
}))

// In-memory Firestore standing in for getDb(): supports the exact surface the
// ratings util uses — collection().doc(), getAll(), runTransaction(get/set).
const store = new Map<string, Record<string, unknown>>()
const txSetMock = vi.fn()

function snapFor(path: string) {
  return { exists: store.has(path), data: () => store.get(path) }
}

const fakeDb = {
  collection: (name: string) => ({ doc: (id: string) => ({ path: `${name}/${id}` }) }),
  getAll: async (...refs: Array<{ path: string }>) => refs.map(ref => snapFor(ref.path)),
  runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
    get: async (ref: { path: string }) => snapFor(ref.path),
    set: (ref: { path: string }, data: Record<string, unknown>) => {
      txSetMock(ref.path, data)
      store.set(ref.path, { ...(store.get(ref.path) || {}), ...data })
    },
  }),
}

vi.mock('~~/server/utils/firebase-admin', () => ({
  getDb: () => fakeDb,
}))

beforeEach(() => {
  store.clear()
  txSetMock.mockClear()
  assertRateLimitMock.mockClear()
  readBodyMock.mockReset()
})

describe('gET /api/ratings', () => {
  it('returns a summary for every tool and seeds missing docs within bounds', async () => {
    const { default: handler } = await import('~~/server/api/ratings/index.get')

    const res = await handler({} as never) as Record<string, { likes: number, dislikes: number, count: number, average: number }>

    expect(Object.keys(res).sort()).toEqual([...TOOL_IDS].sort())
    for (const id of TOOL_IDS) {
      const s = res[id]
      expect(s.count).toBe(s.likes + s.dislikes)
      expect(s.count).toBeGreaterThanOrEqual(300)
      expect(s.count).toBeLessThanOrEqual(2000)
      expect(s.average).toBeGreaterThanOrEqual(4)
      expect(s.average).toBeLessThanOrEqual(5)
      expect(store.has(`tool_ratings/${id}`)).toBe(true)
    }
    expect(txSetMock).toHaveBeenCalledTimes(TOOL_IDS.length)
  })

  it('passes existing docs through untouched and seeds only the missing ones', async () => {
    store.set('tool_ratings/qr-code', { likes: 9, dislikes: 1 })
    const { default: handler } = await import('~~/server/api/ratings/index.get')

    const res = await handler({} as never) as Record<string, { count: number, average: number }>

    expect(res['qr-code']).toEqual({ likes: 9, dislikes: 1, count: 10, average: 4.7 })
    expect(txSetMock).toHaveBeenCalledTimes(TOOL_IDS.length - 1)
    expect(txSetMock).not.toHaveBeenCalledWith('tool_ratings/qr-code', expect.anything())
  })

  it('sets a cache-control header', async () => {
    const { default: handler } = await import('~~/server/api/ratings/index.get')
    await handler({} as never)
    expect(setResponseHeaderMock).toHaveBeenCalledWith({}, 'Cache-Control', expect.stringContaining('max-age=60'))
  })
})

describe('pOST /api/ratings/vote', () => {
  it('rejects an unknown tool id', async () => {
    readBodyMock.mockResolvedValueOnce({ toolId: 'not-a-tool', vote: 'like' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an invalid vote value', async () => {
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'meh' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects a vote equal to the previous one', async () => {
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'like', previous: 'like' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('increments likes on a fresh like', async () => {
    store.set('tool_ratings/qr-code', { likes: 100, dislikes: 50 })
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'like', previous: null })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')

    const res = await handler({} as never)

    expect(res).toEqual({ likes: 101, dislikes: 50, count: 151, average: 4 })
  })

  it('moves the vote when changing like → dislike', async () => {
    store.set('tool_ratings/qr-code', { likes: 100, dislikes: 50 })
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'dislike', previous: 'like' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')

    const res = await handler({} as never)

    expect(res).toMatchObject({ likes: 99, dislikes: 51, count: 150 })
  })

  it('never drives a counter negative on a spoofed previous vote', async () => {
    store.set('tool_ratings/qr-code', { likes: 0, dislikes: 5 })
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'dislike', previous: 'like' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')

    const res = await handler({} as never)

    expect(res).toMatchObject({ likes: 0, dislikes: 6 })
  })

  it('seeds the doc when the first-ever hit is a vote', async () => {
    readBodyMock.mockResolvedValueOnce({ toolId: 'jwt-decoder', vote: 'like', previous: null })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')

    const res = await handler({} as never) as { count: number }

    expect(res.count).toBeGreaterThanOrEqual(301)
    expect(res.count).toBeLessThanOrEqual(2001)
    expect(store.has('tool_ratings/jwt-decoder')).toBe(true)
  })

  it('rate-limits per IP on the tool-rating bucket', async () => {
    readBodyMock.mockResolvedValueOnce({ toolId: 'qr-code', vote: 'like' })
    const { default: handler } = await import('~~/server/api/ratings/vote.post')
    await handler({} as never)
    expect(assertRateLimitMock).toHaveBeenCalledWith(expect.objectContaining({ bucket: 'tool-rating', identity: 'test-ip' }))
  })
})
