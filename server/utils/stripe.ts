import type { H3Event } from 'h3'
import { createError } from 'h3'
import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(event: H3Event): Stripe {
  if (cached)
    return cached
  const config = useRuntimeConfig(event)
  const key = config.stripeSecretKey
  if (!key)
    throw createError({ statusCode: 500, statusMessage: 'Stripe is not configured' })
  cached = new Stripe(key)
  return cached
}
