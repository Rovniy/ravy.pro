import { createError } from 'h3'
import { contractScanCollection } from '~~/server/utils/contract-scan'
import { getDb } from '~~/server/utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const shareId = getRouterParam(event, 'shareId')
  if (!shareId) {
    throw createError({ statusCode: 400, statusMessage: 'shareId is required' })
  }

  // Primary lookup via dedicated share index.
  const shareMap = await getDb().collection('contract_scan_shares').doc(shareId).get()
  let scanDocId = shareMap.exists ? ((shareMap.data()?.scanId as string | undefined) || '') : ''

  // Backward-compatible fallback for older shares created before index mapping.
  if (!scanDocId) {
    const legacy = await contractScanCollection()
      .where('shareId', '==', shareId)
      .where('isShared', '==', true)
      .limit(1)
      .get()
    if (!legacy.empty)
      scanDocId = legacy.docs[0].id
  }

  if (!scanDocId) {
    throw createError({ statusCode: 404, statusMessage: 'Shared report not found' })
  }

  const doc = await contractScanCollection().doc(scanDocId).get()
  if (!doc.exists) {
    throw createError({ statusCode: 404, statusMessage: 'Shared report not found' })
  }

  const data = doc.data() as Record<string, unknown>
  if (data.isShared !== true || data.status !== 'done' || !data.result) {
    throw createError({ statusCode: 404, statusMessage: 'Shared report is not available' })
  }

  // Intentionally return only report data and minimal metadata.
  return {
    id: doc.id,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    result: data.result,
  }
})
