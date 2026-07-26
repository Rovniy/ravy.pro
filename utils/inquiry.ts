// Validation for the /services inquiry form.
//
// Pure and shared: the form imports it as `~/utils/inquiry`, the API route as
// `~~/utils/inquiry`, so the client and the server can never drift on either the
// rules or the error copy. Same pattern as utils/credit-card.ts, utils/jwt.ts
// and utils/rating.ts.

import type { OfferingId } from '~/data/offerings'
import { isOfferingId } from '~/data/offerings'

export const INQUIRY_LIMITS = {
  name: 80,
  contact: 200,
  message: 2000,
  page: 200,
} as const

export interface InquiryInput {
  service?: unknown
  name?: unknown
  contact?: unknown
  message?: unknown
  consent?: unknown
  /** Honeypot. A value here means a bot filled a field humans never see. */
  company?: unknown
  /** Which page the form was submitted from — context for the notification email. */
  page?: unknown
}

export interface Inquiry {
  service: OfferingId
  name: string
  contact: string
  message: string
  page: string
}

export type InquiryResult
  /** Ready to send. */
  = | { status: 'ok', value: Inquiry }
  /** `message` is shown to the person verbatim, so keep it human. */
    | { status: 'invalid', message: string }
  /** Honeypot tripped — the caller reports success and does nothing. */
    | { status: 'honeypot' }

/** C0 + C1 control characters, via the Unicode "Control" category. */
const CONTROL_CHARS = /\p{Cc}/gu

/**
 * Collapses whitespace and strips control characters. Control chars are removed
 * rather than rejected: they turn up in real paste-ins from PDFs and chat
 * clients, and there is no reason to fail a lead over an invisible byte.
 */
function clean(value: unknown): string {
  if (typeof value !== 'string')
    return ''
  return value.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
}

/** Same cleanup, but tabs and paragraph breaks survive — this field is multi-line. */
function cleanMultiline(value: unknown): string {
  if (typeof value !== 'string')
    return ''
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, c => (c === '\n' || c === '\t' ? c : ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function normalizeInquiry(raw: InquiryInput): InquiryResult {
  // Honeypot first, before every other check: a bot that also sent a bad
  // `service` must still get the silent-success path, never a 400 that tells it
  // the field was detected.
  if (clean(raw.company).length > 0)
    return { status: 'honeypot' }

  if (!isOfferingId(raw.service))
    return { status: 'invalid', message: 'Please pick what this is about.' }

  const name = clean(raw.name)
  if (name.length < 2 || name.length > INQUIRY_LIMITS.name)
    return { status: 'invalid', message: 'Tell me what to call you.' }

  // Deliberately loose: `contact` is free-form (@handle, +7…, an email, a wa.me
  // link). Format-validating it would reject real leads, so length caps and
  // control-char stripping are the whole defence — HTML escaping happens at the
  // email boundary.
  const contact = clean(raw.contact)
  if (contact.length < 3 || contact.length > INQUIRY_LIMITS.contact)
    return { status: 'invalid', message: 'Add a Telegram handle, a phone number, or an email — otherwise I can\'t reply.' }

  if (raw.consent !== true)
    return { status: 'invalid', message: 'I need this to be able to reply to you.' }

  // Truncated, not rejected: someone who wrote too much should not lose the
  // submission over it, and the tail of a long message is rarely the point.
  const message = cleanMultiline(raw.message).slice(0, INQUIRY_LIMITS.message)

  const rawPage = clean(raw.page)
  const page = rawPage.startsWith('/') ? rawPage.slice(0, INQUIRY_LIMITS.page) : ''

  return { status: 'ok', value: { service: raw.service, name, contact, message, page } }
}
