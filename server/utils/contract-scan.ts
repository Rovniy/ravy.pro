import type { H3Event } from 'h3'
import type {
  ContractScanPublicRecord,
  ContractScanRecord,
  ContractScanResult,
  ContractScanTeaser,
} from '~~/types/contract-scan'
import { getQuery } from 'h3'
import { getOptionalUser, isAdminEmail } from './access'
import { verifyScanToken } from './contract-scan-token'
import { getDb } from './firebase-admin'

const COLLECTION = 'contract_scans'

function nowIso() {
  return new Date().toISOString()
}

async function updateScan(id: string, patch: Record<string, unknown>) {
  await getDb().collection(COLLECTION).doc(id).set({
    ...patch,
    updatedAt: nowIso(),
  }, { merge: true })
}

function extractTextFromResponse(payload: Record<string, unknown>): string {
  const top = payload.output_text
  if (typeof top === 'string' && top.trim())
    return top

  const output = Array.isArray(payload.output) ? payload.output : []
  const chunks: string[] = []
  for (const item of output) {
    const itemObj = item as Record<string, unknown>
    const content = Array.isArray(itemObj.content) ? itemObj.content : []
    for (const c of content) {
      const cObj = c as Record<string, unknown>
      if (typeof cObj.text === 'string' && cObj.text.trim())
        chunks.push(cObj.text)
    }
  }
  return chunks.join('\n').trim()
}

function buildPrompt(text: string, responseLanguage: string) {
  return `
You are a contract risk analyst specializing in influencer, creator, UGC, and brand advertising agreements.
Analyze the contract from the creator/influencer side.
Your goal is not only to find obvious red flags, but also hidden business risks, one-sided obligations, vague language, missing protections, and jurisdiction-specific traps that a non-lawyer creator may overlook.

Return STRICT JSON with this exact shape:
{
  "language": "string",
  "jurisdiction": "string",
  "overallRiskScore": {
    "score": "low|medium|high|critical",
    "reason": "string"
  },
  "summary": "string",
  "narrowPoints": ["string"],
  "hiddenRisks": ["string"],
  "missingProtections": ["string"],
  "questionsToClarify": ["string"],
  "creatorNegotiationPriorities": [
    {
      "priority": "string",
      "whyItMatters": "string",
      "fallbackPosition": "string"
    }
  ],
  "redFlags": [
    {
      "title": "string",
      "severity": "high|medium|low",
      "clauseQuote": "string",
      "riskType": "payment|usage_rights|exclusivity|liability|termination|approval|jurisdiction|tax|confidentiality|content_control|platform_risk|ip_ownership|data_access|morality|other",
      "whyRisky": "string",
      "creatorImpact": "string",
      "suggestion": "string"
    }
  ]
}

Rules:
- Focus on practical risks for creators.
- Prefer concrete clause quotes from the provided text.
- If a risk comes from missing language, use clauseQuote: "Not found / missing protection".
- Identify both explicit risks and risks from vague/missing wording.
- Keep suggestions concise and actionable.
- If jurisdiction is uncertain, say "Unclear (likely ...)".
- Mention jurisdiction-specific concerns cautiously.
- Do not provide legal advice; this is informational risk spotting.
- Do not invent facts or clauses not present.
- The final output MUST be written in this language: ${responseLanguage}.

Contract text:
"""${text}"""
`.trim()
}

export async function processContractScan(id: string, text: string, openaiApiKey: string, responseLanguage: string) {
  try {
    await updateScan(id, { status: 'processing', progress: 15, step: 'Preparing prompt for model' })
    const prompt = buildPrompt(text, responseLanguage)

    await updateScan(id, { progress: 35, step: 'Analyzing document with GPT' })
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: prompt,
        text: {
          format: {
            type: 'json_schema',
            name: 'contract_scan_result',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                language: { type: 'string' },
                jurisdiction: { type: 'string' },
                overallRiskScore: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    score: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    reason: { type: 'string' },
                  },
                  required: ['score', 'reason'],
                },
                summary: { type: 'string' },
                narrowPoints: {
                  type: 'array',
                  items: { type: 'string' },
                },
                hiddenRisks: {
                  type: 'array',
                  items: { type: 'string' },
                },
                missingProtections: {
                  type: 'array',
                  items: { type: 'string' },
                },
                questionsToClarify: {
                  type: 'array',
                  items: { type: 'string' },
                },
                creatorNegotiationPriorities: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      priority: { type: 'string' },
                      whyItMatters: { type: 'string' },
                      fallbackPosition: { type: 'string' },
                    },
                    required: ['priority', 'whyItMatters', 'fallbackPosition'],
                  },
                },
                redFlags: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      title: { type: 'string' },
                      severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                      clauseQuote: { type: 'string' },
                      riskType: {
                        type: 'string',
                        enum: ['payment', 'usage_rights', 'exclusivity', 'liability', 'termination', 'approval', 'jurisdiction', 'tax', 'confidentiality', 'content_control', 'platform_risk', 'ip_ownership', 'data_access', 'morality', 'other'],
                      },
                      whyRisky: { type: 'string' },
                      creatorImpact: { type: 'string' },
                      suggestion: { type: 'string' },
                    },
                    required: ['title', 'severity', 'clauseQuote', 'riskType', 'whyRisky', 'creatorImpact', 'suggestion'],
                  },
                },
              },
              required: ['language', 'jurisdiction', 'overallRiskScore', 'summary', 'narrowPoints', 'hiddenRisks', 'missingProtections', 'questionsToClarify', 'creatorNegotiationPriorities', 'redFlags'],
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`OpenAI request failed (${response.status}): ${body}`)
    }

    await updateScan(id, { progress: 80, step: 'Formatting risk report' })
    const payload = await response.json() as Record<string, unknown>
    const rawText = extractTextFromResponse(payload)
    if (!rawText)
      throw new Error('OpenAI response does not contain text output')

    const normalized = rawText
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim()

    const result = JSON.parse(normalized) as ContractScanResult

    await updateScan(id, {
      status: 'done',
      progress: 100,
      step: 'Completed',
      result,
    })
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Scan failed'
    await updateScan(id, {
      status: 'error',
      progress: 100,
      step: 'Failed',
      error: message,
    })
    throw new Error(message)
  }
}

export function contractScanCollection() {
  return getDb().collection(COLLECTION)
}

export async function getScanRecord(id: string): Promise<ContractScanRecord | null> {
  const snap = await contractScanCollection().doc(id).get()
  if (!snap.exists)
    return null
  return { id, ...(snap.data() as Omit<ContractScanRecord, 'id'>) }
}

// Free, pre-payment view: risk level, jurisdiction, summary and how many red
// flags were found — never the clause-level analysis (that is the paid product).
export function toTeaser(id: string, data: ContractScanRecord): ContractScanTeaser {
  const flags = data.result?.redFlags ?? []
  const counts = flags.reduce(
    (acc, f) => {
      acc.total += 1
      if (f.severity === 'high')
        acc.high += 1
      else if (f.severity === 'medium')
        acc.medium += 1
      else if (f.severity === 'low')
        acc.low += 1
      return acc
    },
    { high: 0, medium: 0, low: 0, total: 0 },
  )

  return {
    id,
    status: data.status,
    progress: data.progress,
    step: data.step,
    paid: data.paid === true,
    jurisdiction: data.result?.jurisdiction,
    overallRiskScore: data.result?.overallRiskScore,
    summary: data.result?.summary,
    redFlagCounts: data.result ? counts : undefined,
    error: data.error,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// Full result with Stripe/email internals stripped — for the paid result page.
// Named distinctly from steam-audit's toPublicRecord to avoid an auto-import clash.
export function toPublicScanRecord(id: string, data: ContractScanRecord): ContractScanPublicRecord {
  return {
    id,
    status: data.status,
    progress: data.progress,
    step: data.step,
    paid: data.paid === true,
    result: data.result,
    error: data.error,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// Authorisation for the full-report endpoints. Grants access when:
//  - a valid signed token (?t=) names this scan (only ever minted post-payment), OR
//  - a Stripe checkout session_id paid for this exact scan, OR
//  - the caller is the signed-in admin (always free), OR
//  - the caller is the scan's owner AND the scan is already paid.
//
// Crucially, ownership alone does NOT grant access — otherwise any signed-in user
// could read their own report for free and the paywall would be moot.
export async function authorizeContractScanAccess(event: H3Event, id: string): Promise<boolean> {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)

  const token = typeof query.t === 'string' ? query.t : ''
  if (token && (await verifyScanToken(token, config.contractScanTokenSecret)) === id)
    return true

  if (typeof query.session_id === 'string' && query.session_id) {
    try {
      // Lazy import keeps the `stripe` package out of contract-scan.ts's static
      // graph, so it never leaks into the page/prerender bundle.
      const { getStripe } = await import('./stripe')
      const stripe = getStripe(event)
      const session = await stripe.checkout.sessions.retrieve(query.session_id)
      if (session.payment_status === 'paid' && session.metadata?.scanId === id)
        return true
    }
    catch {
      // invalid session — not authorized
    }
  }

  const user = await getOptionalUser(event)
  if (user) {
    if (isAdminEmail(event, user.email))
      return true
    const record = await getScanRecord(id)
    if (record?.paid === true && record.ownerUid && record.ownerUid === user.uid)
      return true
  }

  return false
}

// Called from the Stripe webhook (source of truth for payment). Idempotent:
// only the first transition to paid records the email/session.
export async function markScanPaid(id: string, email: string | undefined, sessionId: string): Promise<void> {
  const ref = contractScanCollection().doc(id)
  const snap = await ref.get()
  if (!snap.exists)
    return
  const data = snap.data() as ContractScanRecord
  if (data.paid === true)
    return // already handled — idempotent

  const patch: Record<string, unknown> = {
    paid: true,
    paidAt: nowIso(),
    stripeSessionId: sessionId,
    updatedAt: nowIso(),
  }
  if (email)
    patch.customerEmail = email.toLowerCase()
  await ref.set(patch, { merge: true })
}
