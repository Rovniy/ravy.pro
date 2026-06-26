import { getQuery } from 'h3'
import { requireAdminUser } from '~~/server/utils/auth'
import { getDb } from '~~/server/utils/firebase-admin'

const AUDIT_COLLECTION = 'access_audit_log'

// Admin-only: the full access-change history, newest first, regardless of which
// admin made the change. Cursor pagination via `?before=<createdAt>`.
export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 200)

  let query = getDb()
    .collection(AUDIT_COLLECTION)
    .orderBy('createdAt', 'desc')

  // Inequality + orderBy share the same field, so no composite index is needed.
  if (typeof q.before === 'string' && q.before)
    query = query.where('createdAt', '<', q.before)

  const snap = await query.limit(limit).get()
  const entries = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  return {
    entries,
    nextCursor: entries.length === limit
      ? (entries[entries.length - 1] as { createdAt?: string }).createdAt ?? null
      : null,
  }
})
