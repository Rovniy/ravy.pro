import { describe, expect, it } from 'vitest'
import {
  base64UrlDecode,
  decodeJwt,
  getAlgInfo,
  getClaimTime,
  getTokenStatus,
  interpretClaims,
} from '../../utils/jwt'

// --- helpers ---------------------------------------------------------------

/** UTF-8 safe base64url encoder, mirroring the decoder. */
function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const b of bytes)
    binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function makeToken(header: object, payload: object, signature = 'sig'): string {
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.${signature}`
}

const NOW = new Date('2026-05-29T12:00:00Z')

// --- base64UrlDecode -------------------------------------------------------

describe('base64UrlDecode', () => {
  it('round-trips ASCII and re-pads missing padding', () => {
    const encoded = base64UrlEncode('{"a":1}')
    expect(encoded).not.toContain('=')
    expect(base64UrlDecode(encoded)).toBe('{"a":1}')
  })

  it('preserves unicode', () => {
    const original = '{"name":"José 🎉"}'
    expect(base64UrlDecode(base64UrlEncode(original))).toBe(original)
  })
})

// --- decodeJwt -------------------------------------------------------------

describe('decodeJwt', () => {
  it('decodes a well-formed token', () => {
    const token = makeToken({ alg: 'HS256', typ: 'JWT' }, { sub: '123', name: 'Ada' })
    const r = decodeJwt(token)
    expect(r.ok).toBe(true)
    expect(r.partCount).toBe(3)
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' })
    expect(r.payload?.sub).toBe('123')
    expect(r.raw.signature).toBe('sig')
    expect(r.errors).toHaveLength(0)
  })

  it('decodes unicode claims', () => {
    const token = makeToken({ alg: 'HS256' }, { name: 'José 🎉' })
    expect(decodeJwt(token).payload?.name).toBe('José 🎉')
  })

  it('strips a leading Bearer prefix', () => {
    const token = makeToken({ alg: 'HS256' }, { sub: '1' })
    expect(decodeJwt(`Bearer ${token}`)).toEqual(decodeJwt(token))
  })

  it('treats a two-part token as valid with empty signature', () => {
    const full = makeToken({ alg: 'HS256' }, { sub: '1' })
    const [h, p] = full.split('.')
    const r = decodeJwt(`${h}.${p}`)
    expect(r.ok).toBe(true)
    expect(r.partCount).toBe(2)
    expect(r.raw.signature).toBe('')
  })

  it('reports an error for a single-part token', () => {
    const r = decodeJwt('notajwt')
    expect(r.ok).toBe(false)
    expect(r.partCount).toBe(1)
    expect(r.errors?.at(0)?.part).toBe('header')
  })

  it('reports invalid base64url in the header', () => {
    const r = decodeJwt('@@@.eyJzdWIiOiIxIn0')
    expect(r.ok).toBe(false)
    expect(r.header).toBeNull()
    expect(r.errors.some(e => e.part === 'header' && /base64url/i.test(e.message))).toBe(true)
  })

  it('reports a non-JSON payload', () => {
    const token = `${base64UrlEncode('{"alg":"HS256"}')}.${base64UrlEncode('not json')}`
    const r = decodeJwt(token)
    expect(r.ok).toBe(false)
    expect(r.payload).toBeNull()
    expect(r.errors.some(e => e.part === 'payload' && /JSON/i.test(e.message))).toBe(true)
  })

  it('never throws on garbage input', () => {
    expect(() => decodeJwt('')).not.toThrow()
    expect(() => decodeJwt('....')).not.toThrow()
  })
})

// --- getAlgInfo ------------------------------------------------------------

describe('getAlgInfo', () => {
  it('maps algorithm families', () => {
    expect(getAlgInfo({ alg: 'HS256' }).family).toBe('HMAC')
    expect(getAlgInfo({ alg: 'RS256' }).family).toBe('RSA')
    expect(getAlgInfo({ alg: 'ES256' }).family).toBe('ECDSA')
    expect(getAlgInfo({ alg: 'PS256' }).family).toBe('RSA-PSS')
  })

  it('flags alg: none', () => {
    const info = getAlgInfo({ alg: 'none' })
    expect(info.isNone).toBe(true)
    expect(info.isWeak).toBe(true)
    expect(info.warning).toBeTruthy()
  })

  it('flags unknown algorithms as weak', () => {
    const info = getAlgInfo({ alg: 'FOO' })
    expect(info.family).toBe('unknown')
    expect(info.isWeak).toBe(true)
    expect(info.warning).toBeTruthy()
  })

  it('handles a missing header', () => {
    expect(getAlgInfo(null).alg).toBeNull()
  })
})

// --- getTokenStatus --------------------------------------------------------

describe('getTokenStatus', () => {
  it('returns valid when exp is in the future', () => {
    expect(getTokenStatus({ exp: NOW.getTime() / 1000 + 3600 }, NOW)).toBe('valid')
  })

  it('returns expired when exp is in the past', () => {
    expect(getTokenStatus({ exp: NOW.getTime() / 1000 - 3600 }, NOW)).toBe('expired')
  })

  it('prioritizes nbf not-yet-valid even with a future exp', () => {
    expect(getTokenStatus({
      nbf: NOW.getTime() / 1000 + 3600,
      exp: NOW.getTime() / 1000 + 7200,
    }, NOW)).toBe('not-yet-valid')
  })

  it('returns no-expiry when exp is absent', () => {
    expect(getTokenStatus({ sub: '1' }, NOW)).toBe('no-expiry')
  })

  it('returns invalid for a null payload', () => {
    expect(getTokenStatus(null, NOW)).toBe('invalid')
  })
})

// --- getClaimTime ----------------------------------------------------------

describe('getClaimTime', () => {
  it('returns null when the claim is absent', () => {
    expect(getClaimTime({ sub: '1' }, 'exp', NOW)).toBeNull()
  })

  it('resolves epoch, date, and past/future', () => {
    const past = getClaimTime({ iat: NOW.getTime() / 1000 - 60 }, 'iat', NOW)
    expect(past?.epoch).toBe(NOW.getTime() / 1000 - 60)
    expect(past?.isPast).toBe(true)
    const future = getClaimTime({ exp: NOW.getTime() / 1000 + 60 }, 'exp', NOW)
    expect(future?.isPast).toBe(false)
  })
})

// --- interpretClaims -------------------------------------------------------

describe('interpretClaims', () => {
  it('annotates standard claims and passes custom ones through', () => {
    const claims = interpretClaims({ sub: '1', role: 'admin' })
    const sub = claims.find(c => c.key === 'sub')
    const role = claims.find(c => c.key === 'role')
    expect(sub?.isStandard).toBe(true)
    expect(sub?.name).toBe('Subject')
    expect(role?.isStandard).toBe(false)
    expect(role?.name).toBeNull()
  })

  it('returns an empty array for a null payload', () => {
    expect(interpretClaims(null)).toEqual([])
  })
})
