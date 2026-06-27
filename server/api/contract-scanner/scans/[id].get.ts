import { createError, getRouterParam } from 'h3'
import { getScanRecord, toTeaser } from '~~/server/utils/contract-scan'

// Public: returns only the teaser (risk level, jurisdiction, summary, red-flag
// counts) so the page can show the scan progress + free preview. The full
// clause-level report is served by the paid `result/[id]` endpoint.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Scan id is required' })

  const record = await getScanRecord(id)
  if (!record)
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })

  return toTeaser(id, record)
})
