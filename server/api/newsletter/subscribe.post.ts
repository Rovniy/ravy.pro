import { createError, readBody } from 'h3'
import { addNewsletterContact } from '~~/server/utils/newsletter'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { reportServerError } from '~~/server/utils/report-error'

const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  // Public endpoint → throttle per IP to block subscription spam.
  await assertRateLimit({ bucket: 'newsletter-subscribe', identity: clientIdentity(event), limit: 5, windowMs: 10 * 60 * 1000 })

  const body = await readBody<{ email?: string }>(event)
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 254)
  if (!EMAIL_RE.test(email))
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address' })

  const config = useRuntimeConfig(event)
  if (!config.resendApiKey)
    throw createError({ statusCode: 500, statusMessage: 'Newsletter is not configured' })

  try {
    // segmentId is optional — without it the contact lands in global Contacts.
    const { status } = await addNewsletterContact({
      email,
      apiKey: config.resendApiKey,
      segmentId: config.resendSegmentId || undefined,
    })
    return { ok: true, status }
  }
  catch (err) {
    reportServerError(err, { kind: 'newsletter-subscribe' })
    throw createError({ statusCode: 502, statusMessage: 'Subscription failed. Please try again in a moment.' })
  }
})
