import { createError, getRequestURL, readBody } from 'h3'
import { seoData } from '~~/data'
import { getOptionalUser } from '~~/server/utils/access'
import { getScanRecord } from '~~/server/utils/contract-scan'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { getStripe } from '~~/server/utils/stripe'

// Creates a Stripe Checkout Session that unlocks the full report for an existing
// (already-scanned) document. Payment is the source of truth — the webhook flips
// the doc to paid. The scan/result must already exist (produced for free).
export default defineEventHandler(async (event) => {
  await assertRateLimit({ bucket: 'contract-checkout', identity: clientIdentity(event), limit: 20, windowMs: 60 * 60 * 1000 })

  const body = await readBody<{ scanId?: unknown }>(event)
  const scanId = typeof body?.scanId === 'string' ? body.scanId.trim() : ''
  if (!scanId)
    throw createError({ statusCode: 400, statusMessage: 'scanId is required' })

  const config = useRuntimeConfig(event)
  if (!config.stripeSecretKey || !config.contractScanPriceId)
    throw createError({ statusCode: 500, statusMessage: 'Payments are not configured' })

  const record = await getScanRecord(scanId)
  if (!record)
    throw createError({ statusCode: 404, statusMessage: 'Scan not found' })
  if (record.status !== 'done' || !record.result)
    throw createError({ statusCode: 400, statusMessage: 'Scan is not finished yet' })

  // Link the purchase to the buyer when signed in, and prefill their email so
  // the report links to the account history.
  const owner = await getOptionalUser(event)

  // In prod the request arrives on the internal Cloud Run host, so use the
  // canonical site URL; in dev use the live origin (so localhost works).
  const origin = import.meta.dev
    ? getRequestURL(event).origin
    : seoData.mySite.replace(/\/+$/, '')

  const stripe = getStripe(event)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: config.contractScanPriceId, quantity: 1 }],
    metadata: { scanId, kind: 'contract-scan' },
    success_url: `${origin}/tools/contract-red-flag-scanner/result/${scanId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tools/contract-red-flag-scanner?checkout=cancelled`,
    customer_creation: 'always',
    allow_promotion_codes: true,
    ...(owner?.email ? { customer_email: owner.email } : {}),
  })

  return { id: scanId, url: session.url }
})
