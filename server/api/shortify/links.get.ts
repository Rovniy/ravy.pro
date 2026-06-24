import { defineEventHandler } from 'h3'
import { requireToolAccess } from '~~/server/utils/access'
import { getDb, SHORTLINKS_COLLECTION } from '~~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'shortify')

  // Each user sees only their own links. Sorted in memory to avoid a composite
  // (createdBy + createdAt) index.
  const snap = await getDb()
    .collection(SHORTLINKS_COLLECTION)
    .where('createdBy', '==', user.uid)
    .get()

  return snap.docs
    .sort((a, b) => ((b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0)))
    .map((doc) => {
      const data = doc.data()
      return {
        code: doc.id,
        url: data.url as string,
        clicks: (data.clicks as number) ?? 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        lastClickedAt: data.lastClickedAt?.toDate?.()?.toISOString() ?? null,
      }
    })
})
