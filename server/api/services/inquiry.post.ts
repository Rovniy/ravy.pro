import { createError, readBody } from 'h3'
import { sendServiceInquiryEmail } from '~~/server/utils/email'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { reportServerError } from '~~/server/utils/report-error'
import { normalizeInquiry } from '~~/utils/inquiry'
import { baseData } from '~/data'
import { offeringById } from '~/data/offerings'

export default defineEventHandler(async (event) => {
  // Public endpoint. An inquiry is a hand-typed, high-intent action, so 3/hour
  // per IP is generous for a human and caps spam volume hard.
  await assertRateLimit({
    bucket: 'service-inquiry',
    identity: clientIdentity(event),
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })

  const body = await readBody<Record<string, unknown>>(event)
  const result = normalizeInquiry(body ?? {})

  // Honeypot: report success, send nothing, record nothing. A 400 here would
  // tell the bot its filler field was detected. If you are ever debugging
  // "the form succeeds but no email arrives", this is the branch to check.
  if (result.status === 'honeypot')
    return { ok: true }

  if (result.status === 'invalid')
    throw createError({ statusCode: 400, statusMessage: result.message })

  const inquiry = result.value
  const offering = offeringById(inquiry.service)

  const config = useRuntimeConfig(event)
  if (!config.resendApiKey)
    throw createError({ statusCode: 500, statusMessage: 'The inquiry form is not configured. Please reach out on Telegram instead.' })

  try {
    await sendServiceInquiryEmail({
      to: baseData.me.email,
      apiKey: config.resendApiKey,
      serviceLabel: offering?.inquiryLabel ?? inquiry.service,
      inquiry,
    })
    return { ok: true }
  }
  catch (err) {
    reportServerError(err, { kind: 'service-inquiry' })
    throw createError({ statusCode: 502, statusMessage: 'Could not send your message. Please try again, or write to me on Telegram.' })
  }
})
