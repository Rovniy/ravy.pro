import { getRequestHeader, readBody, setResponseStatus } from 'h3'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { reportServerError } from '~~/server/utils/report-error'

// Public sink for browser errors. Rate-limited per IP and size-capped so it
// can't be used to flood logs. Re-emits as a structured error tagged `client`
// so browser failures show up in Cloud Error Reporting alongside server ones.
export default defineEventHandler(async (event) => {
  await assertRateLimit({ bucket: 'client-error', identity: clientIdentity(event), limit: 30, windowMs: 10 * 60 * 1000 })

  const body = await readBody<{ message?: string, stack?: string, source?: string, url?: string }>(event)

  const message = String(body?.message || 'Unknown client error').slice(0, 500)
  const stack = String(body?.stack || '').slice(0, 4000)
  const source = String(body?.source || 'client').slice(0, 40)
  const url = String(body?.url || '').slice(0, 500)
  const userAgent = (getRequestHeader(event, 'user-agent') || '').slice(0, 300)

  const err = new Error(message)
  err.name = 'ClientError'
  err.stack = stack || `ClientError: ${message}\n  at ${url || 'unknown'}`

  reportServerError(err, { kind: 'client', source, url, userAgent })

  setResponseStatus(event, 204)
  return null
})
