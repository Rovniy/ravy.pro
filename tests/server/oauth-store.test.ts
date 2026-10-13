import { createHash } from 'node:crypto'
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
    set: async (data: Doc) => void store.set(path, toStored(data)),
    delete: async () => void store.delete(path),
  }
}
// A snapshot is frozen at read time, like Firestore's: deleting the document
// afterwards must not empty a snapshot already taken.
function snap(path: string) {
  const data = store.get(path)
  return { exists: data !== undefined, data: () => data, ref: ref(path) }
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
vi.mock('~~/server/utils/rate-limit', () => ({ assertRateLimit: vi.fn(async () => {}), clientIdentity: () => 'ip' }))

// h3 response helpers, captured instead of written to a socket.
let res: { status: number, headers: Record<string, string> }
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return {
    ...mod,
    setResponseStatus: (_e: unknown, code: number) => void (res.status = code),
    setResponseHeaders: (_e: unknown, h: Record<string, string>) => void Object.assign(res.headers, h),
  }
})

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

describe('oAuth endpoints, end to end', () => {
  const REDIRECT = 'https://claude.ai/api/mcp/auth_callback'
  const verifier = 'v'.repeat(43)
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  function call(handler: (e: never) => unknown, body: Record<string, unknown>, authorization?: string) {
    res = { status: 200, headers: {} }
    vi.stubGlobal('readBody', async () => body)
    vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => (name === 'authorization' ? authorization : undefined))
    vi.stubGlobal('setHeader', (_e: unknown, k: string, v: string) => void (res.headers[k] = v))
    vi.stubGlobal('setResponseStatus', (_e: unknown, code: number) => void (res.status = code))
    return handler({ method: 'POST' } as never) as Promise<Record<string, unknown>>
  }

  async function register() {
    const { default: handler } = await import('~~/server/routes/oauth/register')
    return call(handler, { client_name: 'Claude', redirect_uris: [REDIRECT], token_endpoint_auth_method: 'none' })
  }

  it('registers, exchanges a PKCE code once, rotates the refresh token and revokes', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const reg = await register()
    expect(res.status).toBe(201)
    const clientId = reg.client_id as string

    const { createAuthCode, resolveAccessToken } = await import('~~/server/utils/mcp/oauth-store')
    const code = await createAuthCode({ ...owner, clientId, redirectUri: REDIRECT, codeChallenge: challenge })
    const { default: token } = await import('~~/server/routes/oauth/token')

    const wrongVerifier = await call(token, { grant_type: 'authorization_code', client_id: clientId, code, redirect_uri: REDIRECT, code_verifier: 'x'.repeat(43) })
    expect(wrongVerifier.error).toBe('invalid_grant')

    // The failed attempt consumed the code: codes are single-use even when wrong.
    const replay = await call(token, { grant_type: 'authorization_code', client_id: clientId, code, redirect_uri: REDIRECT, code_verifier: verifier })
    expect(replay.error).toBe('invalid_grant')

    const code2 = await createAuthCode({ ...owner, clientId, redirectUri: REDIRECT, codeChallenge: challenge })
    const issued = await call(token, { grant_type: 'authorization_code', client_id: clientId, code: code2, redirect_uri: REDIRECT, code_verifier: verifier })
    expect(issued.token_type).toBe('Bearer')
    expect(res.headers['Cache-Control']).toBe('no-store')
    expect(await resolveAccessToken(issued.access_token as string)).toMatchObject({ clientId, email: owner.email })

    const rotated = await call(token, { grant_type: 'refresh_token', client_id: clientId, refresh_token: issued.refresh_token })
    expect(rotated.access_token).toBeTruthy()

    const { default: revoke } = await import('~~/server/routes/oauth/revoke')
    await call(revoke, { client_id: clientId, token: rotated.access_token })
    expect(await resolveAccessToken(rotated.access_token as string)).toBeNull()
    vi.unstubAllEnvs()
  })

  it('rejects an unknown client with 401 and a Basic challenge', async () => {
    const { default: token } = await import('~~/server/routes/oauth/token')
    const out = await call(token, { grant_type: 'refresh_token', client_id: 'mcp_nobody', refresh_token: 'x' })
    expect(out.error).toBe('invalid_client')
    expect(res.status).toBe(401)
    expect(res.headers['WWW-Authenticate']).toMatch(/^Basic/)
  })

  it('refuses a registration whose redirect URI is not https or loopback', async () => {
    const { default: handler } = await import('~~/server/routes/oauth/register')
    const out = await call(handler, { client_name: 'x', redirect_uris: ['http://evil.example/cb'] })
    expect(res.status).toBe(400)
    expect(out.error).toBe('invalid_redirect_uri')
  })
})
