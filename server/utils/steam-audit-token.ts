import { createError } from 'h3'
import { jwtVerify, SignJWT } from 'jose'

// Signed, stateless access token for the paid result page. Lets a buyer return
// to their result via a private link without an account (the chosen no-login
// access model). HS256 over the server-only token secret.

function keyOf(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signAccessToken(auditId: string, secret: string): Promise<string> {
  if (!secret)
    throw createError({ statusCode: 500, statusMessage: 'Access token secret is not configured' })
  return new SignJWT({ aid: auditId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('120d')
    .sign(keyOf(secret))
}

// Returns the audit id the token grants access to, or null if invalid/expired.
export async function verifyAccessToken(token: string, secret: string): Promise<string | null> {
  if (!secret || !token)
    return null
  try {
    const { payload } = await jwtVerify(token, keyOf(secret))
    return typeof payload.aid === 'string' ? payload.aid : null
  }
  catch {
    return null
  }
}
