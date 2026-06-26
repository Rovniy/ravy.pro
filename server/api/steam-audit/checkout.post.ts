import { createError, getRequestURL, readBody } from 'h3'
import { seoData } from '~~/data'
import { getOptionalUser } from '~~/server/utils/access'
import { steamAuditCollection } from '~~/server/utils/steam-audit'
import { getStripe } from '~~/server/utils/stripe'
import { classifyAudit, normalizeAnswers } from '~~/utils/steam-ai-ruleset'

// Creates the audit record (awaiting_payment) and a Stripe Checkout Session.
// The classification is recomputed server-side from the submitted answers —
// the client-sent verdict is never trusted.
export default defineEventHandler(async (event) => {
  const body = await readBody<{ answers?: unknown, gameName?: unknown }>(event)
  const answers = normalizeAnswers(body?.answers)
  const classification = classifyAudit(answers)
  const gameName = typeof body?.gameName === 'string' ? body.gameName.trim().slice(0, 120) : ''

  const config = useRuntimeConfig(event)
  if (!config.stripeSecretKey || !config.stripePriceId)
    throw createError({ statusCode: 500, statusMessage: 'Payments are not configured' })

  const now = new Date().toISOString()
  const docRef = steamAuditCollection().doc()
  const doc: Record<string, unknown> = {
    status: 'awaiting_payment',
    progress: 0,
    step: 'Awaiting payment',
    rulesetVersion: classification.rulesetVersion,
    answers,
    classification,
    createdAt: now,
    updatedAt: now,
  }
  if (gameName)
    doc.gameName = gameName

  // Link the audit to the buyer when signed in, so it appears in their account
  // history. Anonymous purchases stay accessible via the emailed link.
  const owner = await getOptionalUser(event)
  if (owner) {
    doc.ownerUid = owner.uid
    doc.ownerEmail = owner.email
  }

  await docRef.set(doc)

  // In prod the request arrives on the internal Cloud Run host, so deriving the
  // origin from the request would send Stripe to the locked-down run.app URL
  // (Google Frontend returns 403 there). Use the canonical site URL in prod and
  // the live request origin only in dev (so localhost + `stripe listen` work).
  const origin = import.meta.dev
    ? getRequestURL(event).origin
    : seoData.mySite.replace(/\/+$/, '')
  const stripe = getStripe(event)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    metadata: { auditId: docRef.id },
    success_url: `${origin}/tools/steam-ai-disclosure/result/${docRef.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/tools/steam-ai-disclosure?checkout=cancelled`,
    customer_creation: 'always',
    allow_promotion_codes: true,
  })

  await docRef.set({ stripeSessionId: session.id, updatedAt: new Date().toISOString() }, { merge: true })

  return { id: docRef.id, url: session.url }
})
