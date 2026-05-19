import { createError } from 'h3'
import { nanoid } from 'nanoid'
import { requireAdminUser } from '~~/server/utils/auth'
import { contractScanCollection } from '~~/server/utils/contract-scan'
import { getDb } from '~~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const admin = await requireAdminUser(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Scan id is required' })
  }

  const ref = contractScanCollection().doc(id)
  const snap = await ref.get()
  if (!snap.exists) {
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })
  }

  const data = snap.data() as Record<string, unknown>
  if (data.ownerUid !== admin.uid) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  if (data.status !== 'done' || !data.result) {
    throw createError({ statusCode: 400, statusMessage: 'Only completed scans can be shared' })
  }

  const shareId = (data.shareId as string | undefined) || nanoid(18)
  await ref.set({
    shareId,
    isShared: true,
    sharedAt: new Date().toISOString(),
  }, { merge: true })

  await getDb().collection('contract_scan_shares').doc(shareId).set({
    scanId: id,
    ownerUid: admin.uid,
    createdAt: new Date().toISOString(),
  }, { merge: true })

  return { shareId }
})
