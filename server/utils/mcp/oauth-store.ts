import type { H3Event } from 'h3'
import type { ClientRegistration } from './oauth'
import process from 'node:process'
import { getRequestURL } from 'h3'
import { baseData } from '~~/data'
import { getDb } from '../firebase-admin'
import {
  ACCESS_TOKEN_TTL_MS,
  AUTH_CODE_TTL_MS,
  hashSecret,
  MCP_SCOPE,
  newSecret,
  OAuthError,
  REFRESH_TOKEN_TTL_MS,
  safeEqual,
  verifyPkce,
} from './oauth'

/**
 * Firestore storage for the MCP authorization server.
 *
 * - `mcp_oauth_clients/{clientId}` — dynamically registered clients.
 * - `mcp_oauth_codes/{sha256(code)}` — single-use authorization codes.
 * - `mcp_oauth_tokens/{sha256(token)}` — access and refresh tokens.
 *
 * Only hashes of codes and tokens are stored. Every expiring document carries
 * `expiresAt` as a Firestore Timestamp, so a TTL policy on that field (as for
 * `rate_limits`) cleans them up; expiry is also checked on every read, so the
 * policy is housekeeping, not a control.
 */

const clients = () => getDb().collection('mcp_oauth_clients')
const codes = () => getDb().collection('mcp_oauth_codes')
const tokens = () => getDb().collection('mcp_oauth_tokens')

/**
 * The issuer and resource URLs. Fixed to the canonical site URL in production —
 * they are compared byte for byte by clients, and the request host could just
 * as well be the `*.hosted.app` backend domain. Dev uses whatever host it runs on.
 */
export function siteOrigin(event: H3Event): string {
  if (process.env.NODE_ENV === 'production')
    return baseData.site.url
  return getRequestURL(event).origin
}

export interface StoredClient {
  clientId: string
  clientName: string
  redirectUris: string[]
  authMethod: ClientRegistration['authMethod']
  secretHash: string
}

export async function registerClient(reg: ClientRegistration): Promise<{ clientId: string, clientSecret?: string, issuedAt: number }> {
  const clientId = `mcp_${newSecret().slice(0, 24)}`
  const clientSecret = reg.authMethod === 'none' ? undefined : newSecret()
  const issuedAt = Math.floor(Date.now() / 1000)
  await clients().doc(clientId).set({
    clientName: reg.clientName,
    redirectUris: reg.redirectUris,
    authMethod: reg.authMethod,
    secretHash: clientSecret ? hashSecret(clientSecret) : '',
    createdAt: new Date(),
  })
  return { clientId, clientSecret, issuedAt }
}

export async function getClient(clientId: string): Promise<StoredClient | null> {
  if (!/^mcp_[\w-]{1,64}$/.test(clientId))
    return null
  const snap = await clients().doc(clientId).get()
  if (!snap.exists)
    return null
  const data = snap.data() ?? {}
  return {
    clientId,
    clientName: String(data.clientName ?? 'Unnamed client'),
    redirectUris: Array.isArray(data.redirectUris) ? data.redirectUris.filter((u: unknown): u is string => typeof u === 'string') : [],
    authMethod: data.authMethod ?? 'none',
    secretHash: String(data.secretHash ?? ''),
  }
}

/** Confidential clients must present their secret; public ones present none. */
export function authenticateClient(client: StoredClient, secret: string): boolean {
  if (client.authMethod === 'none')
    return true
  return !!secret && !!client.secretHash && safeEqual(hashSecret(secret), client.secretHash)
}

export interface CodeGrant {
  clientId: string
  redirectUri: string
  codeChallenge: string
  email: string
  uid: string
  resource: string
}

export async function createAuthCode(grant: CodeGrant): Promise<string> {
  const code = newSecret()
  await codes().doc(hashSecret(code)).set({
    ...grant,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
  })
  return code
}

/**
 * Redeems a code exactly once. The delete happens inside the transaction, so a
 * replayed code fails even when both requests arrive together.
 */
export async function redeemAuthCode(code: string, check: { clientId: string, redirectUri: string, verifier: string }): Promise<CodeGrant> {
  const ref = codes().doc(hashSecret(code))
  const grant = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists)
      return null
    tx.delete(ref)
    return snap.data() as CodeGrant & { expiresAt: { toMillis: () => number } }
  })
  if (!grant || grant.expiresAt.toMillis() < Date.now())
    throw new OAuthError('invalid_grant', 'Authorization code is invalid or expired')
  if (grant.clientId !== check.clientId)
    throw new OAuthError('invalid_grant', 'Authorization code was issued to another client')
  if (grant.redirectUri !== check.redirectUri)
    throw new OAuthError('invalid_grant', 'redirect_uri does not match the authorization request')
  if (!verifyPkce(check.verifier, grant.codeChallenge))
    throw new OAuthError('invalid_grant', 'PKCE verification failed')
  return grant
}

export interface TokenOwner {
  clientId: string
  email: string
  uid: string
  resource: string
}

export interface IssuedTokens {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: string
}

export async function issueTokens(owner: TokenOwner): Promise<IssuedTokens> {
  const access = newSecret()
  const refresh = newSecret()
  const now = Date.now()
  const batch = getDb().batch()
  batch.set(tokens().doc(hashSecret(access)), {
    ...owner,
    kind: 'access',
    expiresAt: new Date(now + ACCESS_TOKEN_TTL_MS),
    createdAt: new Date(now),
  })
  batch.set(tokens().doc(hashSecret(refresh)), {
    ...owner,
    kind: 'refresh',
    expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
    createdAt: new Date(now),
  })
  await batch.commit()
  return {
    access_token: access,
    token_type: 'Bearer',
    expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
    refresh_token: refresh,
    scope: MCP_SCOPE,
  }
}

/** Rotates a refresh token: the old one is consumed, a new pair is issued. */
export async function rotateRefreshToken(refresh: string, clientId: string): Promise<IssuedTokens> {
  const ref = tokens().doc(hashSecret(refresh))
  const owner = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists || snap.data()?.kind !== 'refresh')
      return null
    tx.delete(ref)
    return snap.data() as TokenOwner & { expiresAt: { toMillis: () => number } }
  })
  if (!owner || owner.expiresAt.toMillis() < Date.now())
    throw new OAuthError('invalid_grant', 'Refresh token is invalid or expired')
  if (owner.clientId !== clientId)
    throw new OAuthError('invalid_grant', 'Refresh token was issued to another client')
  return issueTokens({ clientId: owner.clientId, email: owner.email, uid: owner.uid, resource: owner.resource })
}

/** The owner of a live access token, or null. */
export async function resolveAccessToken(token: string): Promise<TokenOwner | null> {
  if (!token || token.length > 200)
    return null
  const snap = await tokens().doc(hashSecret(token)).get()
  if (!snap.exists)
    return null
  const data = snap.data() as TokenOwner & { kind: string, expiresAt: { toMillis: () => number } }
  if (data.kind !== 'access' || data.expiresAt.toMillis() < Date.now())
    return null
  return { clientId: data.clientId, email: data.email, uid: data.uid, resource: data.resource }
}

/** RFC 7009. Unknown tokens are not an error. */
export async function revokeToken(token: string, clientId: string): Promise<void> {
  const ref = tokens().doc(hashSecret(token))
  const snap = await ref.get()
  if (snap.exists && snap.data()?.clientId === clientId)
    await ref.delete()
}

/** Every token belonging to this account — the studio's "disconnect" button. */
export async function revokeAllForEmail(email: string): Promise<number> {
  const snap = await tokens().where('email', '==', email).get()
  if (snap.empty)
    return 0
  const batch = getDb().batch()
  for (const doc of snap.docs)
    batch.delete(doc.ref)
  await batch.commit()
  return snap.size
}

export interface ConnectedClient {
  clientId: string
  clientName: string
  lastIssuedAt: string
}

/** Clients holding a live refresh token for this account. */
export async function listConnectedClients(email: string): Promise<ConnectedClient[]> {
  const snap = await tokens().where('email', '==', email).get()
  const latest = new Map<string, number>()
  const now = Date.now()
  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.kind !== 'refresh' || data.expiresAt?.toMillis?.() < now)
      continue
    const created = data.createdAt?.toMillis?.() ?? 0
    latest.set(data.clientId, Math.max(latest.get(data.clientId) ?? 0, created))
  }
  const result: ConnectedClient[] = []
  for (const [clientId, at] of latest) {
    const client = await getClient(clientId)
    result.push({ clientId, clientName: client?.clientName ?? 'Unknown client', lastIssuedAt: new Date(at).toISOString() })
  }
  return result.sort((a, b) => (a.lastIssuedAt < b.lastIssuedAt ? 1 : -1))
}
