import { requireAdminUser } from '~~/server/utils/auth'
import { contractScanCollection } from '~~/server/utils/contract-scan'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event)
  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 20, 1), 100)

  const snap = await contractScanCollection()
    .where('ownerUid', '==', admin.uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))
})
