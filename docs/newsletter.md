# Newsletter (Resend)

Subscriptions go into **Resend Contacts**; you compose and send newsletters from
the **Resend dashboard → Broadcasts**. No new dependency — the same Resend HTTP
API already used for transactional email.

> Heads up: Resend **renamed "Audiences" → "Segments"** and moved to a global
> Contacts model. So in the dashboard you'll see **Contacts** and **Segments**,
> not "Audiences". You do **not** need to create anything to start — the API key
> alone is enough; a Segment is optional.

## Minimum setup (already enough)

Just the Resend API key — which the site already uses:

- `NUXT_RESEND_API_KEY=re_...`

With this, every subscriber is added to your Resend **Contacts** (global list).
Locally put it in `.env`; in prod it's an App Hosting secret (same place as the
other `NUXT_*` keys).

## Optional: a Segment (only if you want to group/target)

Segments let you target a subset with a broadcast. To use one:

1. Resend dashboard → **Contacts** (left nav) → **Segments** tab → **Create segment**.
2. Open the segment; its **ID** is in the page URL — `https://resend.com/segments/SEG_ID` — (also shown in the segment's details).
3. Set `NUXT_RESEND_SEGMENT_ID=SEG_ID` (locally + prod). New subscribers will then
   be added to that segment as well as global Contacts.

If you don't set it, subscribers still land in global Contacts and you can target
**all contacts** when sending.

## How subscription works

- Footer form → `POST /api/newsletter/subscribe` (rate-limited per IP, 5 / 10 min).
- Server validates the email and calls Resend `POST /contacts`
  (`unsubscribed: false`, plus the segment if `NUXT_RESEND_SEGMENT_ID` is set).
- Re-subscribing an existing email is treated as success.

## Sending a newsletter (broadcast)

1. Resend dashboard → **Broadcasts** → **Create broadcast**.
2. Choose recipients: **all contacts** (or your segment), write subject + content.
3. **Send** or schedule. Resend auto-adds the unsubscribe link and tracks
   opens/clicks; unsubscribes update the contact automatically — no code needed.

## Notes

- The from-address domain must be a **verified Resend domain** (same as transactional email).
- **Single opt-in** today. For double opt-in later, add a confirmation-email step
  before the contact is created.
- Subscriber data lives in Resend, so there's nothing to back up or expire on our side.
