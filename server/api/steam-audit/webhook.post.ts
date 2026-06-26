import type Stripe from 'stripe'
import { createError, getRequestHeader, readRawBody } from 'h3'
import { reportServerEvent } from '~~/server/utils/report-error'
import { markPaidAndGenerate } from '~~/server/utils/steam-audit'
import { getStripe } from '~~/server/utils/stripe'

// Stripe webhook — the SOURCE OF TRUTH for payment. Signature is verified
// against the RAW request body, so this handler must read the raw body (never
// readBody, which would parse and break the signature check).
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.stripeWebhookSecret)
    throw createError({ statusCode: 500, statusMessage: 'Webhook is not configured' })

  const signature = getRequestHeader(event, 'stripe-signature')
  const raw = await readRawBody(event)
  if (!signature || !raw)
    throw createError({ statusCode: 400, statusMessage: 'Missing signature or body' })

  const stripe = getStripe(event)
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, signature, config.stripeWebhookSecret)
  }
  catch (err) {
    reportServerEvent('WARNING', 'Stripe webhook signature verification failed', { kind: 'stripe-webhook', detail: String(err) })
    throw createError({ statusCode: 400, statusMessage: 'Invalid webhook signature' })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const auditId = session.metadata?.auditId
    if (auditId && session.payment_status === 'paid') {
      const email = session.customer_details?.email
        ?? (typeof session.customer_email === 'string' ? session.customer_email : undefined)
        ?? undefined
      await markPaidAndGenerate(auditId, email, session.id, {
        openaiApiKey: config.openaiApiKey,
        resendApiKey: config.resendApiKey,
        tokenSecret: config.steamAuditTokenSecret,
      })
    }
  }

  return { received: true }
})
