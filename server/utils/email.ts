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
