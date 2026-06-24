import { createError, getRouterParam } from 'h3'
import { authorizeAuditAccess, getAuditRecord, toPublicRecord } from '~~/server/utils/steam-audit'
import { signAccessToken } from '~~/server/utils/steam-audit-token'

// Returns the public audit record for the result page. Authorises by a signed
// access token (?t=, the durable link) or a Stripe session_id from the checkout
// redirect. Mints a fresh token so the page can build a permanent, account-free
// link.
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  if (!(await authorizeAuditAccess(event, id)))
    throw createError({ statusCode: 403, statusMessage: 'Not authorized to view this result' })

  const record = await getAuditRecord(id)
  if (!record)
    throw createError({ statusCode: 404, statusMessage: 'Audit not found' })

  const config = useRuntimeConfig(event)
  const accessToken = await signAccessToken(id, config.steamAuditTokenSecret)
  return { record: toPublicRecord(id, record), token: accessToken }
})
