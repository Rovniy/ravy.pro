import { defineEventHandler } from 'h3'
import { getDb, SHORTLINKS_COLLECTION } from '~~/server/utils/firebase-admin'
import { requireAdminUser } from '~~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const snap = await getDb()
    .collection(SHORTLINKS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get()

  return snap.docs.map((doc) => {
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
