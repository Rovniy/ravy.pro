// Pure, synchronous JWT decoding and claim interpretation.
// No `jose`, no async, no DOM — keeps this trivially unit-testable. Signature
// verification (which needs Web Crypto and the async `jose` API) lives in the
// page component, not here. Functions that depend on the current time take an
// injectable `now` so tests stay deterministic.

export type JwtPart = 'header' | 'payload'

export interface JwtPartError {
  part: JwtPart
  message: string
}

export interface DecodedJwt {
  /** True when both header and payload decoded to valid JSON. */
  ok: boolean
  raw: { header: string, payload: string, signature: string }
  partCount: number
  header: Record<string, unknown> | null
  payload: Record<string, unknown> | null
  errors: JwtPartError[]
}

export type TokenStatus = 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry' | 'invalid'

export type TimeClaim = 'exp' | 'nbf' | 'iat'

export interface ClaimTimeInfo {
  claim: TimeClaim
  epoch: number
  date: Date
  absolute: string
  relative: string
  isPast: boolean
}

export type AlgFamily = 'HMAC' | 'RSA' | 'ECDSA' | 'RSA-PSS' | 'none' | 'unknown'

export interface AlgInfo {
  alg: string | null
  family: AlgFamily
  isNone: boolean
  isWeak: boolean
  warning: string | null
}

export interface StandardClaimDef {
  key: string
  name: string
  description: string
}

export interface InterpretedClaim {
  key: string
  value: unknown
  name: string | null
  description: string | null
  isStandard: boolean
}

export const STANDARD_CLAIMS: StandardClaimDef[] = [
  { key: 'iss', name: 'Issuer', description: 'Principal that issued the JWT.' },
  { key: 'sub', name: 'Subject', description: 'Principal that is the subject of the JWT.' },
  { key: 'aud', name: 'Audience', description: 'Recipients the JWT is intended for.' },
  { key: 'exp', name: 'Expiration Time', description: 'Time after which the JWT must not be accepted.' },
  { key: 'nbf', name: 'Not Before', description: 'Time before which the JWT must not be accepted.' },
  { key: 'iat', name: 'Issued At', description: 'Time at which the JWT was issued.' },
  { key: 'jti', name: 'JWT ID', description: 'Unique identifier for the JWT.' },
]

const STANDARD_CLAIM_MAP: Record<string, StandardClaimDef> = Object.fromEntries(
  STANDARD_CLAIMS.map(c => [c.key, c]),
)

const ALG_FAMILY: Record<string, AlgFamily> = {
  HS256: 'HMAC',
  HS384: 'HMAC',
  HS512: 'HMAC',
  RS256: 'RSA',
  RS384: 'RSA',
  RS512: 'RSA',
  ES256: 'ECDSA',
  ES384: 'ECDSA',
  ES512: 'ECDSA',
  PS256: 'RSA-PSS',
  PS384: 'RSA-PSS',
  PS512: 'RSA-PSS',
  none: 'none',
}

/**
 * Decode a single base64url segment to a UTF-8 string.
 * Browser- and SSR-safe (uses `atob` + `TextDecoder`, both present in Node 18+
 * and browsers). Throws on malformed input — callers wrap in try/catch.
 */
export function base64UrlDecode(segment: string): string {
  // base64url -> base64
  let b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  // re-pad to a multiple of 4 (`jose` omits padding, `atob` requires it)
  while (b64.length % 4 !== 0)
    b64 += '='
  const binary = atob(b64)
  // Decode as UTF-8 so multibyte/unicode claims survive intact.
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

function decodePart(segment: string, part: JwtPart): { value: Record<string, unknown> | null, error: JwtPartError | null } {
  let json: string
  try {
    json = base64UrlDecode(segment)
  }
  catch {
    return { value: null, error: { part, message: 'Invalid base64url encoding.' } }
  }
  try {
    const parsed = JSON.parse(json)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
      return { value: null, error: { part, message: 'Decoded content is not a JSON object.' } }
    return { value: parsed as Record<string, unknown>, error: null }
  }
  catch {
    return { value: null, error: { part, message: 'Decoded content is not valid JSON.' } }
  }
}

/**
 * Decode a JWT into its header, payload, and raw signature.
 * Never throws — all failures are reported through `ok`/`errors`.
 */
export function decodeJwt(token: string): DecodedJwt {
  let value = (token || '').trim()
  // Accept a pasted `Authorization: Bearer <token>` value.
  if (/^bearer\s+/i.test(value))
    value = value.replace(/^bearer\s+/i, '').trim()

  const segs = value ? value.split('.') : []
  const partCount = segs.length
  const raw = {
    header: segs[0] ?? '',
    payload: segs[1] ?? '',
    signature: segs[2] ?? '',
  }

  if (partCount < 2) {
    return {
      ok: false,
      raw,
      partCount,
      header: null,
      payload: null,
      errors: [{
        part: 'header',
        message: 'A JWT must have at least a header and a payload separated by ".".',
      }],
    }
  }

  const errors: JwtPartError[] = []
  const headerResult = decodePart(raw.header, 'header')
  const payloadResult = decodePart(raw.payload, 'payload')
  if (headerResult.error)
    errors.push(headerResult.error)
  if (payloadResult.error)
    errors.push(payloadResult.error)

  return {
    ok: headerResult.value !== null && payloadResult.value !== null,
    raw,
    partCount,
    header: headerResult.value,
    payload: payloadResult.value,
    errors,
  }
}

/** Inspect the header's `alg` and flag insecure choices. */
export function getAlgInfo(header: Record<string, unknown> | null): AlgInfo {
  const alg = typeof header?.alg === 'string' ? header.alg : null
  if (!alg)
    return { alg: null, family: 'unknown', isNone: false, isWeak: false, warning: null }

  const family = ALG_FAMILY[alg] ?? 'unknown'
  if (family === 'none') {
    return {
      alg,
      family,
      isNone: true,
      isWeak: true,
      warning: '"alg: none" carries no signature and provides no integrity protection. Never accept it in production.',
    }
  }
  if (family === 'unknown') {
    return {
      alg,
      family,
      isNone: false,
      isWeak: true,
      warning: `Unrecognized algorithm "${alg}". This tool cannot verify it.`,
    }
  }
  return { alg, family, isNone: false, isWeak: false, warning: null }
}

function readEpoch(payload: Record<string, unknown> | null, claim: TimeClaim): number | null {
  const raw = payload?.[claim]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : null
}

/** Token status derived from `nbf`/`exp` (nbf takes precedence). */
export function getTokenStatus(payload: Record<string, unknown> | null, now: Date = new Date()): TokenStatus {
  if (!payload)
    return 'invalid'
  const ms = now.getTime()
  const nbf = readEpoch(payload, 'nbf')
  if (nbf !== null && nbf * 1000 > ms)
    return 'not-yet-valid'
  const exp = readEpoch(payload, 'exp')
  if (exp !== null)
    return exp * 1000 < ms ? 'expired' : 'valid'
  return 'no-expiry'
}

/** Human-readable relative time, e.g. "in 3 hours" / "5 minutes ago". */
export function formatRelative(date: Date, now: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffSec = Math.round((date.getTime() - now.getTime()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]
  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSec) >= secondsInUnit || unit === 'second') {
      const value = Math.round(diffSec / secondsInUnit)
      return rtf.format(value, unit)
    }
  }
  return rtf.format(0, 'second')
}

/** Resolve a numeric time claim into absolute + relative descriptions. */
export function getClaimTime(payload: Record<string, unknown> | null, claim: TimeClaim, now: Date = new Date()): ClaimTimeInfo | null {
  const epoch = readEpoch(payload, claim)
  if (epoch === null)
    return null
  const date = new Date(epoch * 1000)
  return {
    claim,
    epoch,
    date,
    absolute: date.toLocaleString(),
    relative: formatRelative(date, now),
    isPast: date.getTime() < now.getTime(),
  }
}

/** Annotate every payload claim with standard-claim metadata where known. */
export function interpretClaims(payload: Record<string, unknown> | null): InterpretedClaim[] {
  if (!payload)
    return []
  return Object.keys(payload).map((key) => {
    const def = STANDARD_CLAIM_MAP[key]
    return {
      key,
      value: payload[key],
      name: def?.name ?? null,
      description: def?.description ?? null,
      isStandard: Boolean(def),
    }
  })
}
