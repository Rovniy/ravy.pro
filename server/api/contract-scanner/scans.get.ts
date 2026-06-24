import { requireToolAccess } from '~~/server/utils/access'
import { contractScanCollection } from '~~/server/utils/contract-scan'

export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'contract-scanner')
  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 20, 1), 100)

  const snap = await contractScanCollection()
    .where('ownerUid', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get()

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }))
})
