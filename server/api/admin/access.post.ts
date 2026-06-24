import { createError, readBody } from 'h3'
import { GATED_TOOL_KEYS } from '~~/data/services'
import { accessCollection } from '~~/server/utils/access'
import { requireAdminUser } from '~~/server/utils/auth'

// Admin-only: set the full set of gated tools granted to an email. Empty set
// removes the grant. Unknown tool keys are ignored.
export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event)
  const body = await readBody<{ email?: string, tools?: unknown }>(event)

  const email = (body?.email || '').trim().toLowerCase()
  if (!email || !email.includes('@'))
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' })

  const tools = Array.isArray(body?.tools)
    ? body.tools.filter((t): t is string => typeof t === 'string' && GATED_TOOL_KEYS.includes(t))
    : []

  const ref = accessCollection().doc(email)
  if (tools.length === 0) {
    await ref.delete()
  }
  else {
    await ref.set({
      email,
      tools,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    }, { merge: true })
  }

  return { email, tools }
})
