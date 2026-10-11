import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  authorizationServerMetadata,
  buildRedirect,
  clientCredentials,
  isAcceptableResource,
  isAllowedRedirectUri,
  OAuthError,
  parseRegistration,
  protectedResourceMetadata,
  redirectUriMatches,
  verifyPkce,
} from '~~/server/utils/mcp/oauth'

const ORIGIN = 'https://ravy.pro'

describe('pkce', () => {
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  it('accepts the matching S256 verifier', () => {
    expect(verifyPkce(verifier, challenge)).toBe(true)
  })

  it('rejects a different verifier', () => {
    expect(verifyPkce(`${verifier.slice(0, -1)}Y`, challenge)).toBe(false)
  })

  it('rejects a verifier too short to be one (RFC 7636 §4.1)', () => {
    expect(verifyPkce('short', createHash('sha256').update('short').digest('base64url'))).toBe(false)
  })
})

describe('redirect uris', () => {
  it('allows https and loopback http only', () => {
    expect(isAllowedRedirectUri('https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(isAllowedRedirectUri('http://localhost:33418/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://127.0.0.1:5000/cb')).toBe(true)
    expect(isAllowedRedirectUri('http://evil.example/cb')).toBe(false)
    expect(isAllowedRedirectUri('javascript:alert(1)')).toBe(false)
    expect(isAllowedRedirectUri('https://claude.ai/cb#frag')).toBe(false)
    expect(isAllowedRedirectUri('https://user:pw@claude.ai/cb')).toBe(false)
  })

  it('matches exactly, except for the port of a loopback redirect', () => {
    const registered = ['https://claude.ai/api/mcp/auth_callback', 'http://localhost:1234/callback']
    expect(redirectUriMatches(registered, 'https://claude.ai/api/mcp/auth_callback')).toBe(true)
    expect(redirectUriMatches(registered, 'https://claude.ai/api/mcp/auth_callback/x')).toBe(false)
    expect(redirectUriMatches(registered, 'https://claude.com/api/mcp/auth_callback')).toBe(false)
    expect(redirectUriMatches(registered, 'http://localhost:9999/callback')).toBe(true)
    expect(redirectUriMatches(registered, 'http://localhost:9999/other')).toBe(false)
  })
})

describe('parseRegistration', () => {
  it('defaults to a public client', () => {
    const reg = parseRegistration({ redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], client_name: 'Claude' })
    expect(reg).toEqual({ redirectUris: ['https://claude.ai/api/mcp/auth_callback'], clientName: 'Claude', authMethod: 'none' })
  })

  it('refuses a non-loopback http redirect', () => {
    expect(() => parseRegistration({ redirect_uris: ['http://evil.example/cb'] })).toThrow(OAuthError)
  })

  it('refuses unsupported grants and auth methods', () => {
    expect(() => parseRegistration({ redirect_uris: ['https://a.example/cb'], grant_types: ['client_credentials'] })).toThrow(OAuthError)
    expect(() => parseRegistration({ redirect_uris: ['https://a.example/cb'], token_endpoint_auth_method: 'private_key_jwt' })).toThrow(OAuthError)
  })
})

describe('clientCredentials', () => {
  it('reads HTTP Basic', () => {
    const header = `Basic ${Buffer.from('mcp_abc:s3cret').toString('base64')}`
    expect(clientCredentials(header, {})).toEqual({ clientId: 'mcp_abc', clientSecret: 's3cret' })
  })

  it('falls back to the form body', () => {
    expect(clientCredentials(undefined, { client_id: 'mcp_x' })).toEqual({ clientId: 'mcp_x', clientSecret: '' })
  })
})

describe('metadata', () => {
  it('points the resource at this server as its own authorization server', () => {
    const meta = protectedResourceMetadata(ORIGIN)
    expect(meta.resource).toBe('https://ravy.pro/mcp')
    expect(meta.authorization_servers).toEqual([ORIGIN])
  })

  it('advertises S256 only', () => {
    const meta = authorizationServerMetadata(ORIGIN)
    expect(meta.issuer).toBe(ORIGIN)
    expect(meta.code_challenge_methods_supported).toEqual(['S256'])
    expect(meta.registration_endpoint).toBe('https://ravy.pro/oauth/register')
  })
})

describe('resource indicator', () => {
  it('accepts this endpoint or nothing', () => {
    expect(isAcceptableResource(undefined, ORIGIN)).toBe(true)
    expect(isAcceptableResource('https://ravy.pro/mcp', ORIGIN)).toBe(true)
    expect(isAcceptableResource('https://other.example/mcp', ORIGIN)).toBe(false)
  })
})

describe('buildRedirect', () => {
  it('keeps the registered query and skips empty params', () => {
    const url = buildRedirect('https://a.example/cb?x=1', { code: 'c', state: '', iss: ORIGIN })
    expect(url).toBe('https://a.example/cb?x=1&code=c&iss=https%3A%2F%2Fravy.pro')
  })
})
