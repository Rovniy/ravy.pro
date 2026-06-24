import { createError, getRouterParam } from 'h3'
import { authorizeAuditAccess, retryGeneration } from '~~/server/utils/steam-audit'

// Re-runs generation for a paid audit that errored or got stuck. No new charge —
// it reuses the stored classification. Authorised the same way as the result
// page (signed token or paid Stripe session).
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  if (!(await authorizeAuditAccess(event, id)))
    throw createError({ statusCode: 403, statusMessage: 'Not authorized' })

  const config = useRuntimeConfig(event)
  const status = await retryGeneration(id, {
    openaiApiKey: config.openaiApiKey,
    resendApiKey: config.resendApiKey,
    tokenSecret: config.steamAuditTokenSecret,
  })

  return { status }
})
