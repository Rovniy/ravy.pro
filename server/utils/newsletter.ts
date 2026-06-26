// Newsletter subscription via Resend Contacts (no new dependency — same HTTP
// API we already use for transactional email). Resend renamed "Audiences" to
// "Segments" and moved to a global Contacts model, so we add the subscriber to
// global Contacts via POST /contacts and, optionally, attach them to a Segment.
// Broadcasts are composed and sent from the Resend dashboard.

export interface AddContactParams {
  email: string
  apiKey: string
  segmentId?: string
}

export async function addNewsletterContact(params: AddContactParams): Promise<{ status: 'subscribed' | 'already' }> {
  const { email, apiKey, segmentId } = params

  const res = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
    }),
  })

  if (res.ok)
    return { status: 'subscribed' }

  const text = await res.text().catch(() => '')
  // Re-subscribing an existing contact is a success from the user's POV.
  if (/already|exists|duplicate/i.test(text))
    return { status: 'already' }

  throw new Error(`Resend contact create failed (${res.status}): ${text}`)
}
