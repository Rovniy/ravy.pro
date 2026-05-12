import type { H3Event } from 'h3'
import { createError, getRequestHeader } from 'h3'
import { getAdminAuth } from './firebase-admin'

export interface AdminUser {
  uid: string
  email: string
}

export async function requireAdminUser(event: H3Event): Promise<AdminUser> {
  const header = getRequestHeader(event, 'authorization') ?? ''
  // Capture is anchored to a non-whitespace start so the regex stays linear
  // (\s+ followed by .+ otherwise allows catastrophic backtracking on input
  // crafted with many trailing spaces).
  const match = header.match(/^Bearer\s+(\S.*)$/i)
  if (!match) {
    throw createError({ statusCode: 401, statusMessage: 'Missing bearer token' })
  }

  const config = useRuntimeConfig(event)
  const adminEmail = (config.shortifyAdminEmail || '').toLowerCase()
  if (!adminEmail) {
    throw createError({ statusCode: 500, statusMessage: 'Admin email not configured' })
  }

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(match[1])
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }

  const email = (decoded.email ?? '').toLowerCase()
  if (!decoded.email_verified || email !== adminEmail) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return { uid: decoded.uid, email }
}
