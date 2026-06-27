import { createError, getRouterParam } from 'h3'
import { authorizeContractScanAccess, getScanRecord, toPublicScanRecord } from '~~/server/utils/contract-scan'
import { signScanToken } from '~~/server/utils/contract-scan-token'

// Returns the full contract-scan report for the result page. Authorises by a
// signed access token (?t=, the durable link), a Stripe session_id from the
// checkout redirect, or a signed-in admin/owner. Mints a fresh token so the page
// can build a permanent, account-free link.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  if (!(await authorizeContractScanAccess(event, id)))
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to view this report' })

  const record = await getScanRecord(id)
  if (!record)
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })

  const config = useRuntimeConfig(event)
  const token = await signScanToken(id, config.contractScanTokenSecret)
  return { record: toPublicScanRecord(id, record), token }
})
