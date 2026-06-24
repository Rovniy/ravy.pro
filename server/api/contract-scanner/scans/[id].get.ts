import { createError } from 'h3'
import { requireToolAccess } from '~~/server/utils/access'
import { contractScanCollection } from '~~/server/utils/contract-scan'

export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'contract-scanner')
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Scan id is required' })
  }

  const snap = await contractScanCollection().doc(id).get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })
  }

  const data = snap.data() as Record<string, unknown>
  if (data.ownerUid !== user.uid) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return {
    id: snap.id,
    ...data,
  }
})
