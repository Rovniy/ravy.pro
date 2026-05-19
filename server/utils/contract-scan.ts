import type { ContractScanResult } from '~~/types/contract-scan'
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
