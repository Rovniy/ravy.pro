import { createError } from 'h3'
import { requireAdminUser } from '~~/server/utils/auth'
import { contractScanCollection } from '~~/server/utils/contract-scan'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Scan id is required' })
  }

  const snap = await contractScanCollection().doc(id).get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })
  }

  const data = snap.data() as Record<string, unknown>
  if (data.ownerUid !== admin.uid) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return {
    id: snap.id,
    ...data,
  }
})
