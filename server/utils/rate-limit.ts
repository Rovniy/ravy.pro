import type { H3Event } from 'h3'
import { createError, getRequestIP } from 'h3'
import { getDb } from './firebase-admin'
import { reportServerEvent } from './report-error'

const COLLECTION = 'rate_limits'

export interface RateLimitOptions {
  bucket: string // logical endpoint name, e.g. 'contract-scan'
  identity: string // uid / email / ip — who the limit applies to
  limit: number // max requests allowed within the window
  windowMs: number // window length in ms
}

// Fixed-window counter in Firestore. Atomic via a transaction, and FAIL-OPEN:
// a rate-limit-store hiccup must never take the endpoint down. Each window is a
// separate doc; set a Firestore TTL policy on `rate_limits.expiresAt` to
// auto-clean expired windows.
export async function assertRateLimit(opts: RateLimitOptions): Promise<void> {
  const { bucket, identity, limit, windowMs } = opts
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs
  const ref = getDb().collection(COLLECTION).doc(`${bucket}__${identity}__${windowStart}`)

  let count: number
  try {
    count = await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref)
      const current = snap.exists ? Number(snap.data()?.count ?? 0) : 0
      const next = current + 1
      tx.set(ref, {
        count: next,
        bucket,
        windowStart,
        expiresAt: new Date(windowStart + windowMs * 2),
      }, { merge: true })
      return next
    })
  }
  catch (err) {
    reportServerEvent('WARNING', 'Rate limit check failed — allowing request', { kind: 'rate-limit', detail: String(err) })
    return
  }

  if (count > limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please slow down and try again later.',
    })
  }
}

// Best-effort client identity for anonymous endpoints. Behind a proxy/CDN the
// real client IP is in x-forwarded-for.
export function clientIdentity(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}
