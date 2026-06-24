// Steam AI Disclosure Audit — shared types.
//
// The deterministic verdict (classification) is produced by `classifyAudit()`
// in `utils/steam-ai-ruleset.ts` and is the same on client and server. The AI
// step only writes the polished disclosure prose stored in `SteamAuditResult`.

export type AiAnswer = 'none' | 'dev_only' | 'shipped_pre' | 'shipped_live' | 'unsure'

export type DisclosureOutcome = 'none' | 'exempt' | 'pre' | 'live' | 'gray'

export type SteamAuditAnswers = Record<string, AiAnswer>

export interface CategoryClassification {
  id: string
  label: string
  answer: AiAnswer
  outcome: DisclosureOutcome
  rationale: string
  flag?: string
}

export interface SteamAuditClassification {
  rulesetVersion: string
  perCategory: CategoryClassification[]
  mustDisclose: boolean
  hasPre: boolean
  hasLive: boolean
  hasGray: boolean
}

export interface SteamAuditResult {
  // Paste-ready text for the Steamworks Content Survey "Pre-Generated AI Content" field.
  preGeneratedText: string
  // Paste-ready text for the "Live-Generated AI Content" field (empty when no runtime AI).
  liveGeneratedText: string
  // Guardrails description required by Valve alongside Live-Generated content.
  liveGuardrailsText: string
  // Player-facing disclosure shown on the store page ("AI Generated Content Disclosure").
  storePublicText: string
  perCategoryRationale: { category: string, note: string }[]
  communityPhrasingNotes: string[]
}

export type SteamAuditStatus = 'awaiting_payment' | 'paid' | 'processing' | 'done' | 'error'

export interface SteamAuditRecord {
  id: string
  status: SteamAuditStatus
  progress: number
  step: string
  gameName?: string
  rulesetVersion: string
  answers: SteamAuditAnswers
  classification: SteamAuditClassification
  result?: SteamAuditResult
  customerEmail?: string
  stripeSessionId?: string
  shareId?: string
  error?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

// Trimmed record returned to the browser — never leaks Stripe/email internals.
export interface SteamAuditPublicRecord {
  id: string
  status: SteamAuditStatus
  progress: number
  step: string
  gameName?: string
  rulesetVersion: string
  classification: SteamAuditClassification
  result?: SteamAuditResult
  error?: string
  createdAt: string
  updatedAt: string
}
