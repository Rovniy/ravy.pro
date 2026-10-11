import { Buffer } from 'node:buffer'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Pure OAuth 2.1 helpers for the MCP endpoint.
 *
 * The site is its own authorization server: claude.ai (and Claude Code) find it
 * through the RFC 9728 / RFC 8414 metadata documents, register themselves with
 * RFC 7591 dynamic client registration, and run the authorization-code flow
 * with PKCE. The person consenting signs in with the site's existing Firebase
 * Google login, and must hold the `studio` grant — the same gate as /studio.
 *
 * Nothing here touches Firestore or h3; the storage is in `oauth-store.ts`.
 */

export const MCP_SCOPE = 'blog'
export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
export const REFRESH_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000
export const AUTH_CODE_TTL_MS = 5 * 60 * 1000

/** Path of the MCP endpoint, also the OAuth `resource` it protects. */
export const MCP_PATH = '/mcp'

export function mcpResourceUrl(origin: string): string {
  return `${origin}${MCP_PATH}`
}

export function protectedResourceMetadataUrl(origin: string): string {
  return `${origin}/.well-known/oauth-protected-resource${MCP_PATH}`
}

/** RFC 9728. */
export function protectedResourceMetadata(origin: string) {
  return {
    resource: mcpResourceUrl(origin),
    authorization_servers: [origin],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'ravy.pro blog',
  }
}

/** RFC 8414. */
export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/oauth/token`,
    registration_endpoint: `${origin}/oauth/register`,
    revocation_endpoint: `${origin}/oauth/revoke`,
    scopes_supported: [MCP_SCOPE],
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
    revocation_endpoint_auth_methods_supported: ['none', 'client_secret_post', 'client_secret_basic'],
  }
}

/** 256 bits, URL-safe. Used for codes, tokens, client ids and secrets. */
export function newSecret(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Tokens and codes are stored only as their SHA-256, so a read of the
 * collection cannot be replayed against the endpoint. No salt is needed: the
 * inputs are 256-bit random values, not passwords.
 */
export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** RFC 7636 S256. `plain` is refused — OAuth 2.1 drops it. */
export function verifyPkce(verifier: string, challenge: string): boolean {
  if (!/^[\w.~-]{43,128}$/.test(verifier))
    return false
  const computed = createHash('sha256').update(verifier).digest('base64url')
  return safeEqual(computed, challenge)
}

export function isValidCodeChallenge(challenge: unknown): challenge is string {
  return typeof challenge === 'string' && /^[\w-]{43}$/.test(challenge)
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * A redirect URI a client may register: https anywhere, or http on loopback
 * (Claude Code catches the callback on a localhost port). No fragment, no
 * credentials — both are forbidden by the spec and both are phishing aids.
 */
export function isAllowedRedirectUri(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 2000)
    return false
  let url: URL
  try {
    url = new URL(uri)
  }
  catch {
    return false
  }
  if (url.hash || url.username || url.password)
    return false
  if (url.protocol === 'https:')
    return true
  return url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)
}

/**
 * Exact match, except that a loopback redirect may use any port — RFC 8252
 * §7.3, which native clients rely on because they pick a free port per run.
 */
export function redirectUriMatches(registered: string[], candidate: string): boolean {
  if (registered.includes(candidate))
    return true
  let cand: URL
  try {
    cand = new URL(candidate)
  }
  catch {
    return false
  }
  if (cand.protocol !== 'http:' || !LOOPBACK_HOSTS.has(cand.hostname))
    return false
  return registered.some((r) => {
    try {
      const reg = new URL(r)
      return reg.protocol === 'http:' && reg.hostname === cand.hostname && reg.pathname === cand.pathname && reg.search === cand.search
    }
    catch {
      return false
    }
  })
}

export type TokenEndpointAuthMethod = 'none' | 'client_secret_post' | 'client_secret_basic'

export interface ClientRegistration {
  redirectUris: string[]
  clientName: string
  authMethod: TokenEndpointAuthMethod
}

export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message)
  }
}

/** RFC 7591 request → what we store. Throws `OAuthError` on anything malformed. */
export function parseRegistration(body: unknown): ClientRegistration {
  const raw = (body ?? {}) as Record<string, unknown>
  const uris = raw.redirect_uris
  if (!Array.isArray(uris) || !uris.length || uris.length > 10)
    throw new OAuthError('invalid_redirect_uri', 'redirect_uris must be a non-empty array')
  for (const uri of uris) {
    if (!isAllowedRedirectUri(uri))
      throw new OAuthError('invalid_redirect_uri', `Redirect URI not allowed: ${String(uri).slice(0, 200)}`)
  }

  const grantTypes = raw.grant_types
  if (Array.isArray(grantTypes) && grantTypes.some(g => g !== 'authorization_code' && g !== 'refresh_token'))
    throw new OAuthError('invalid_client_metadata', 'Only authorization_code and refresh_token grants are supported')

  const method = raw.token_endpoint_auth_method ?? 'none'
  if (method !== 'none' && method !== 'client_secret_post' && method !== 'client_secret_basic')
    throw new OAuthError('invalid_client_metadata', `Unsupported token_endpoint_auth_method: ${String(method)}`)

  const name = typeof raw.client_name === 'string' ? raw.client_name.trim().slice(0, 100) : ''

  return {
    redirectUris: [...new Set(uris as string[])],
    clientName: name || 'Unnamed client',
    authMethod: method,
  }
}

/** Credentials from either `client_secret_basic` or the form body. */
export function clientCredentials(authorization: string | undefined, form: Record<string, string>): { clientId: string, clientSecret: string } {
  const basic = authorization?.match(/^Basic\s+(\S+)$/i)?.[1]
  if (basic) {
    const decoded = Buffer.from(basic, 'base64').toString('utf8')
    const sep = decoded.indexOf(':')
    if (sep > 0) {
      return {
        clientId: decodeURIComponent(decoded.slice(0, sep)),
        clientSecret: decodeURIComponent(decoded.slice(sep + 1)),
      }
    }
  }
  return { clientId: form.client_id ?? '', clientSecret: form.client_secret ?? '' }
}

/** Builds the redirect back to the client, preserving any query it registered. */
export function buildRedirect(redirectUri: string, params: Record<string, string | undefined>): string {
  const url = new URL(redirectUri)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '')
      url.searchParams.set(key, value)
  }
  return url.toString()
}

/**
 * The `resource` a client asks for must be this server's MCP endpoint (RFC
 * 8707). Absent is tolerated — older clients don't send it.
 */
export function isAcceptableResource(resource: unknown, origin: string): boolean {
  if (resource === undefined || resource === null || resource === '')
    return true
  if (typeof resource !== 'string')
    return false
  const expected = mcpResourceUrl(origin)
  return resource === expected || resource === `${expected}/` || resource === origin || resource === `${origin}/`
}
