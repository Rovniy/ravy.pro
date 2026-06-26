import { createError, readBody } from 'h3'
import { GATED_TOOL_KEYS } from '~~/data/services'
import { accessCollection } from '~~/server/utils/access'
import { requireAdminUser } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/firebase-admin'
import { reportServerError } from '~~/server/utils/report-error'

const AUDIT_COLLECTION = 'access_audit_log'

// Admin-only: set the full set of gated tools granted to an email. Empty set
// removes the grant. Unknown tool keys are ignored. Every mutation is recorded
// in `access_audit_log` (who / what / when, with old + new tool sets).
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

  // Snapshot the previous grant for the audit trail before mutating.
  const prevSnap = await ref.get()
  const prevTools = prevSnap.exists && Array.isArray(prevSnap.data()?.tools)
    ? (prevSnap.data()!.tools as string[])
    : []

  const now = new Date().toISOString()
  if (tools.length === 0)
    await ref.delete()
  else
    await ref.set({ email, tools, updatedAt: now, updatedBy: admin.email }, { merge: true })

  // Append an immutable audit entry. Best-effort: a logging failure must not
  // make the already-applied grant change look like it failed.
  try {
    await getDb().collection(AUDIT_COLLECTION).add({
      createdAt: now,
      action: tools.length === 0 ? 'revoke' : 'set',
      targetEmail: email,
      oldTools: prevTools,
      newTools: tools,
      adminUid: admin.uid,
      adminEmail: admin.email,
    })
  }
  catch (err) {
    reportServerError(err, { kind: 'access-audit-write', targetEmail: email })
  }

  return { email, tools }
})
