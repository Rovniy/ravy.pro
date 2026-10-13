import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory Firestore covering the surface oauth-store uses: doc get/set/
// update/delete, equality queries, batch, bulkWriter and transactions.
interface Doc { [k: string]: unknown }
const store = new Map<string, Doc>()

function ts(ms: number) {
  return { toMillis: () => ms }
}
// Firestore hands Dates back as Timestamps.
function toStored(data: Doc): Doc {
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v instanceof Date ? ts(v.getTime()) : v]))
}

function ref(path: string) {
  return {
    path,
    get: async () => snap(path),
    delete: async () => void store.delete(path),
  }
}
function snap(path: string) {
  return { exists: store.has(path), data: () => store.get(path), ref: ref(path) }
}

const fakeDb = {
  collection: (name: string) => ({
    doc: (id: string) => ref(`${name}/${id}`),
    where: (field: string, _op: string, value: unknown) => ({
      get: async () => {
        const docs = [...store.entries()]
          .filter(([path, data]) => path.startsWith(`${name}/`) && data[field] === value)
          .map(([path]) => snap(path))
        return { empty: !docs.length, size: docs.length, docs }
      },
    }),
  }),
  batch: () => {
    const ops: Array<() => void> = []
    return {
      set: (r: { path: string }, data: Doc) => ops.push(() => store.set(r.path, toStored(data))),
      commit: async () => ops.forEach(op => op()),
    }
  },
  bulkWriter: () => ({
    delete: async (r: { path: string }) => void store.delete(r.path),
    close: async () => {},
  }),
  runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
    get: async (r: { path: string }) => snap(r.path),
    update: (r: { path: string }, data: Doc) => store.set(r.path, { ...store.get(r.path), ...toStored(data) }),
    delete: (r: { path: string }) => store.delete(r.path),
  }),
}

vi.mock('~~/server/utils/firebase-admin', () => ({ getDb: () => fakeDb }))

const owner = { clientId: 'mcp_a', email: 'me@example.com', uid: 'u1', resource: 'https://ravy.pro/mcp' }

beforeEach(() => {
  store.clear()
  vi.useRealTimers()
})

describe('refresh token rotation', () => {
  it('issues a new pair in the same family and keeps the old token as used', async () => {
    const { issueTokens, rotateRefreshToken } = await import('~~/server/utils/mcp/oauth-store')
    const first = await issueTokens(owner, 'fam1')
    const second = await rotateRefreshToken(first.refresh_token, 'mcp_a')

    expect(second.refresh_token).not.toBe(first.refresh_token)
    const families = [...store.values()].map(d => d.familyId)
    expect(families.every(f => f === 'fam1')).toBe(true)
    expect(store.size).toBe(4)
    expect([...store.values()].filter(d => d.usedAt)).toHaveLength(1)
  })

  it('rejects a retry inside the grace window without revoking the family', async () => {
    const { issueTokens, rotateRefreshToken } = await import('~~/server/utils/mcp/oauth-store')
    const first = await issueTokens(owner, 'fam1')
    await rotateRefreshToken(first.refresh_token, 'mcp_a')

    await expect(rotateRefreshToken(first.refresh_token, 'mcp_a')).rejects.toMatchObject({ code: 'invalid_grant' })
    expect(store.size).toBe(4)
  })

  it('revokes the whole family when a used token is replayed after the grace window', async () => {
    const { issueTokens, rotateRefreshToken, REFRESH_REUSE_GRACE_MS, resolveAccessToken } = await import('~~/server/utils/mcp/oauth-store')
    const first = await issueTokens(owner, 'fam1')
    const second = await rotateRefreshToken(first.refresh_token, 'mcp_a')
    // An unrelated authorization by the same user must survive.
    const other = await issueTokens(owner, 'fam2')

    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + REFRESH_REUSE_GRACE_MS + 1000)
    await expect(rotateRefreshToken(first.refresh_token, 'mcp_a')).rejects.toMatchObject({ code: 'invalid_grant' })

    expect(await resolveAccessToken(second.access_token)).toBeNull()
    await expect(rotateRefreshToken(second.refresh_token, 'mcp_a')).rejects.toMatchObject({ code: 'invalid_grant' })
    expect(await resolveAccessToken(other.access_token)).toMatchObject({ email: 'me@example.com' })
  })

  it('rejects a refresh token presented by another client', async () => {
    const { issueTokens, rotateRefreshToken } = await import('~~/server/utils/mcp/oauth-store')
    const first = await issueTokens(owner, 'fam1')
    await expect(rotateRefreshToken(first.refresh_token, 'mcp_other')).rejects.toMatchObject({ code: 'invalid_grant' })
  })
})

describe('revokeAllForEmail', () => {
  it('deletes every token of the account, past the 500-write batch limit', async () => {
    const { issueTokens, listConnectedClients, revokeAllForEmail } = await import('~~/server/utils/mcp/oauth-store')
    for (let i = 0; i < 260; i++)
      await issueTokens(owner)
    expect(await revokeAllForEmail('me@example.com')).toBe(520)
    expect(store.size).toBe(0)
    expect(await listConnectedClients('me@example.com')).toEqual([])
  })
})
