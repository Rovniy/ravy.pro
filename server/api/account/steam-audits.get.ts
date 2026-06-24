import type { SteamAuditRecord } from '~~/types/steam-audit'
import { requireUser } from '~~/server/utils/auth'
import { steamAuditCollection, toPublicRecord } from '~~/server/utils/steam-audit'
import { signAccessToken } from '~~/server/utils/steam-audit-token'

// The signed-in user's Steam audits. Matched both by ownerUid (purchases made
// while logged in) and by customerEmail (anonymous purchases on the same email).
// Each item carries a fresh access token so the account can deep-link the result
// page without a Stripe session.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const config = useRuntimeConfig(event)
  const col = steamAuditCollection()

  const [byUid, byEmail] = await Promise.all([
    col.where('ownerUid', '==', user.uid).limit(100).get(),
    col.where('customerEmail', '==', user.email).limit(100).get(),
  ])

  // Merge + dedupe, then sort newest-first in memory (avoids a composite index).
  const map = new Map<string, SteamAuditRecord>()
  for (const doc of [...byUid.docs, ...byEmail.docs])
    map.set(doc.id, doc.data() as SteamAuditRecord)

  const sorted = [...map.entries()].sort(([, a], [, b]) =>
    (a.createdAt < b.createdAt ? 1 : -1))

  const items = await Promise.all(sorted.map(async ([id, data]) => ({
    record: toPublicRecord(id, data),
    token: await signAccessToken(id, config.steamAuditTokenSecret),
  })))

  return { items }
})
