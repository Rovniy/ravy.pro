// Minimal transactional email via Resend's HTTP API (no SDK → server-side
// fetch, CSP untouched). Used to send the buyer their private result link.
// Sending is best-effort: a failure here must never break payment processing.

const FROM = 'Ravy.pro <noreply@ravy.pro>'

export async function sendResultEmail(params: {
  to: string
  url: string
  gameName?: string
  apiKey: string
}): Promise<void> {
  const { to, url, gameName, apiKey } = params
  if (!apiKey || !to)
    return

  const subject = gameName
    ? `Your Steam AI disclosure for ${gameName}`
    : 'Your Steam AI disclosure pack'

  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Your Steam AI disclosure pack is ready</h2>
      <p>The paste-ready Steamworks texts and your dated compliance protocol are waiting.</p>
      <p style="margin: 20px 0;">
        <a href="${url}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Open your result</a>
      </p>
      <p style="color:#64748b;font-size:14px;">Keep this link private — it is your access to the disclosure texts and protocol.</p>
    </div>`.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
}

// Emails the private link to a paid Contract Red-Flag Scanner report.
// Best-effort: a failure here must never break payment processing.
export async function sendContractScanEmail(params: {
  to: string
  url: string
  apiKey: string
}): Promise<void> {
  const { to, url, apiKey } = params
  if (!apiKey || !to)
    return

  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Your contract red-flag report is ready</h2>
      <p>Your full report — every flagged clause, why it is risky, suggested fixes, and your negotiation priorities — is unlocked.</p>
      <p style="margin: 20px 0;">
        <a href="${url}" style="background:#0f172a;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Open your report</a>
      </p>
      <p style="color:#64748b;font-size:14px;">Keep this link private — it is your access to the full report.</p>
    </div>`.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject: 'Your contract red-flag report', html }),
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Notifies the site owner of a new /services inquiry.
//
// UNLIKE the two helpers above, this one is deliberately NOT best-effort: a
// silently-failed inquiry is a lost lead, so a non-2xx from Resend throws and
// the route turns that into a 502 the sender can see. The helpers above only
// interpolate trusted URLs; every value here is attacker-controlled text landing
// in a mail client, so it all goes through escapeHtml().
export async function sendServiceInquiryEmail(params: {
  to: string
  apiKey: string
  serviceLabel: string
  inquiry: { name: string, contact: string, message: string, page: string }
}): Promise<void> {
  const { to, apiKey, serviceLabel, inquiry } = params

  const row = (label: string, value: string) => `
      <tr>
        <td style="padding:6px 16px 6px 0;color:#64748b;font-size:14px;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:#0f172a;font-size:14px;">${value}</td>
      </tr>`

  const html = `
    <div style="font-family: -apple-system, Segoe UI, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">New inquiry — ${escapeHtml(serviceLabel)}</h2>
      <table style="border-collapse:collapse;">
        ${row('Service', escapeHtml(serviceLabel))}
        ${row('Name', escapeHtml(inquiry.name))}
        ${row('Contact', escapeHtml(inquiry.contact))}
        ${inquiry.page ? row('From page', escapeHtml(inquiry.page)) : ''}
      </table>
      ${inquiry.message
        ? `<p style="margin:20px 0 6px;color:#64748b;font-size:14px;">Message</p>
           <div style="padding:12px 16px;border-left:3px solid #cbd5e1;color:#0f172a;font-size:14px;">${escapeHtml(inquiry.message).replace(/\n/g, '<br>')}</div>`
        : ''}
      <p style="color:#64748b;font-size:13px;margin-top:24px;">Reply via the contact above — it may be a messenger handle rather than an email address.</p>
    </div>`.trim()

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to,
      subject: `New ${serviceLabel} inquiry — ${inquiry.name}`,
      html,
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Resend send failed (${res.status}): ${detail}`)
  }
}
