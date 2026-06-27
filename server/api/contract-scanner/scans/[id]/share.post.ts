import { createError, getRouterParam } from 'h3'
import { nanoid } from 'nanoid'
import { authorizeContractScanAccess, contractScanCollection } from '~~/server/utils/contract-scan'
import { getDb } from '~~/server/utils/firebase-admin'

// Creates a public share link for a paid scan. Authorised the same way as the
// full report (token / Stripe session / admin / owner), and only once paid.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Scan id is required' })

  if (!(await authorizeContractScanAccess(event, id)))
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to share this report' })

  const ref = contractScanCollection().doc(id)
  const snap = await ref.get()
  if (!snap.exists)
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })

  const data = snap.data() as Record<string, unknown>
  if (data.status !== 'done' || !data.result)
    throw createError({ statusCode: 400, statusMessage: 'Only completed scans can be shared' })
  if (data.paid !== true)
    throw createError({ statusCode: 402, statusMessage: 'Unlock the full report before sharing' })

  const shareId = (data.shareId as string | undefined) || nanoid(18)
  await ref.set({
    shareId,
    isShared: true,
    sharedAt: new Date().toISOString(),
  }, { merge: true })

  await getDb().collection('contract_scan_shares').doc(shareId).set({
    scanId: id,
    ownerUid: (data.ownerUid as string | undefined) || null,
    createdAt: new Date().toISOString(),
  }, { merge: true })

  return { shareId }
})
