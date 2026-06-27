import { createError } from 'h3'
import { jwtVerify, SignJWT } from 'jose'

// Signed, stateless access token for the paid contract-scan result page. Lets a
// buyer return to their full report via a private link without an account. HS256
// over the server-only token secret. Mirrors steam-audit-token.ts (claim: `sid`).

function keyOf(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signScanToken(scanId: string, secret: string): Promise<string> {
  if (!secret)
    throw createError({ statusCode: 500, statusMessage: 'Access token secret is not configured' })
  return new SignJWT({ sid: scanId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('120d')
    .sign(keyOf(secret))
}

// Returns the scan id the token grants access to, or null if invalid/expired.
export async function verifyScanToken(token: string, secret: string): Promise<string | null> {
  if (!secret || !token)
    return null
  try {
    const { payload } = await jwtVerify(token, keyOf(secret))
    return typeof payload.sid === 'string' ? payload.sid : null
  }
  catch {
    return null
  }
}
