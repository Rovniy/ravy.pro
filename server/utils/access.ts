import type { H3Event } from 'h3'
import type { AuthedUser } from './auth'
import { createError, getRequestHeader } from 'h3'
import { GATED_TOOL_KEYS } from '~~/data/services'
import { requireUser } from './auth'
import { getAdminAuth, getDb } from './firebase-admin'

const TOOL_ACCESS_COLLECTION = 'tool_access'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function adminEmail(event: H3Event): string {
  return normalizeEmail(useRuntimeConfig(event).shortifyAdminEmail || '')
}

export function isAdminEmail(event: H3Event, email: string): boolean {
  const admin = adminEmail(event)
  return !!admin && normalizeEmail(email) === admin
}

// Pure decision used by requireToolAccess — unit-tested in isolation.
export function decideToolAccess(isAdmin: boolean, grantedTools: string[], toolKey: string): boolean {
  return isAdmin || grantedTools.includes(toolKey)
}

export const accessCollection = () => getDb().collection(TOOL_ACCESS_COLLECTION)

// Tool keys a given email may use. Admin implicitly has every gated tool.
export async function getGrantedTools(event: H3Event, email: string): Promise<string[]> {
  if (isAdminEmail(event, email))
    return [...GATED_TOOL_KEYS]
  const snap = await accessCollection().doc(normalizeEmail(email)).get()
  if (!snap.exists)
    return []
  const tools = snap.data()?.tools
  return Array.isArray(tools) ? tools.filter((t): t is string => typeof t === 'string') : []
}

// Authorize the caller for a specific gated tool. Throws 403 if not allowed.
export async function requireToolAccess(event: H3Event, toolKey: string): Promise<AuthedUser> {
  const user = await requireUser(event)
  const admin = isAdminEmail(event, user.email)
  const grantedTools = admin ? [...GATED_TOOL_KEYS] : await getGrantedTools(event, user.email)
  if (!decideToolAccess(admin, grantedTools, toolKey))
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this tool' })
  return user
}

// Soft auth: returns the user if a valid Bearer token is present, else null.
// Used to optionally attach an owner to anonymous-capable flows (Steam checkout).
export async function getOptionalUser(event: H3Event): Promise<AuthedUser | null> {
  const header = getRequestHeader(event, 'authorization') ?? ''
  const match = header.match(/^Bearer\s+(\S.*)$/i)
  const token = match?.[1]
  if (!token)
    return null
  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    const email = (decoded.email ?? '').toLowerCase()
    if (!decoded.email_verified || !email)
      return null
    return { uid: decoded.uid, email }
  }
  catch {
    return null
  }
}
