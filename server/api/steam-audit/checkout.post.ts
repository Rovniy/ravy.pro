import { createError, getRequestURL, readBody } from 'h3'
import { seoData } from '~~/data'
import { getOptionalUser, isAdminEmail } from '~~/server/utils/access'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'
import { compAndGenerate, steamAuditCollection } from '~~/server/utils/steam-audit'
import { signAccessToken } from '~~/server/utils/steam-audit-token'
import { getStripe } from '~~/server/utils/stripe'
import { classifyAudit, normalizeAnswers } from '~~/utils/steam-ai-ruleset'

// Creates the audit record (awaiting_payment) and a Stripe Checkout Session.
// The classification is recomputed server-side from the submitted answers —
// the client-sent verdict is never trusted.
//
// The signed-in admin skips Stripe entirely: the audit is comped and generation
// starts immediately, and the response points straight at the result page.
export default defineEventHandler(async (event) => {
  // Public endpoint: throttle by IP to prevent Stripe-session / Firestore spam.
  await assertRateLimit({ bucket: 'steam-checkout', identity: clientIdentity(event), limit: 10, windowMs: 60 * 60 * 1000 })

  const body = await readBody<{ answers?: unknown, gameName?: unknown }>(event)
  const answers = normalizeAnswers(body?.answers)
  const classification = classifyAudit(answers)
  const gameName = typeof body?.gameName === 'string' ? body.gameName.trim().slice(0, 120) : ''

  // Link the audit to the buyer when signed in, so it appears in their account
  // history. Anonymous purchases stay accessible via the emailed link.
  const owner = await getOptionalUser(event)
  const isAdmin = !!owner && isAdminEmail(event, owner.email)

  const config = useRuntimeConfig(event)
  if (!isAdmin && (!config.stripeSecretKey || !config.stripePriceId))
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

  if (owner) {
    doc.ownerUid = owner.uid
    doc.ownerEmail = owner.email
  }

  await docRef.set(doc)

  // Admin: unlock for free and start generating right away. The result page is
  // reached with a signed token, exactly like a paid run.
  if (isAdmin) {
    await compAndGenerate(docRef.id, owner?.email, {
      openaiApiKey: config.openaiApiKey,
      resendApiKey: config.resendApiKey,
      tokenSecret: config.steamAuditTokenSecret,
    })
    const token = await signAccessToken(docRef.id, config.steamAuditTokenSecret)
    return {
      id: docRef.id,
      url: `/tools/steam-ai-disclosure/result/${docRef.id}?t=${token}`,
      free: true,
    }
  }

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
