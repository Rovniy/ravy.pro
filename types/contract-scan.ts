export interface ContractScanRedFlag {
  title: string
  severity: 'high' | 'medium' | 'low'
  clauseQuote: string
  riskType: 'payment' | 'usage_rights' | 'exclusivity' | 'liability' | 'termination' | 'approval' | 'jurisdiction' | 'tax' | 'confidentiality' | 'content_control' | 'platform_risk' | 'ip_ownership' | 'data_access' | 'morality' | 'other'
  whyRisky: string
  creatorImpact: string
  suggestion: string
}

export interface ContractScanOverallRisk {
  score: 'low' | 'medium' | 'high' | 'critical'
  reason: string
}

export interface ContractScanNegotiationPriority {
  priority: string
  whyItMatters: string
  fallbackPosition: string
}

export interface ContractScanResult {
  language: string
  jurisdiction: string
  overallRiskScore: ContractScanOverallRisk
  summary: string
  narrowPoints: string[]
  hiddenRisks: string[]
  missingProtections: string[]
  questionsToClarify: string[]
  creatorNegotiationPriorities: ContractScanNegotiationPriority[]
  redFlags: ContractScanRedFlag[]
}

export type ContractScanStatus = 'queued' | 'processing' | 'done' | 'error'

export interface ContractScanRecord {
  id: string
  // Set when the scan was started by a signed-in user; anonymous scans omit it.
  ownerUid?: string
  ownerEmail?: string
  status: ContractScanStatus
  progress: number
  step: string
  inputPreview?: string
  result?: ContractScanResult
  responseLanguage?: string
  error?: string
  // Paywall state. The scan + result are produced for free; `paid` unlocks the
  // full report. Set by the Stripe webhook (source of truth).
  paid?: boolean
  paidAt?: string
  stripeSessionId?: string
  customerEmail?: string
  // Public sharing (post-purchase) — see /scan-share/[shareId].
  shareId?: string
  isShared?: boolean
  sharedAt?: string
  createdAt: string
  updatedAt: string
}

export interface ContractScanRedFlagCounts {
  high: number
  medium: number
  low: number
  total: number
}

// Free, pre-payment view: enough to prove value (risk level + how many flags)
// without exposing the actual clause analysis.
export interface ContractScanTeaser {
  id: string
  status: ContractScanStatus
  progress: number
  step: string
  paid: boolean
  jurisdiction?: string
  overallRiskScore?: ContractScanOverallRisk
  summary?: string
  redFlagCounts?: ContractScanRedFlagCounts
  error?: string
  createdAt: string
  updatedAt: string
}

// Full result with internal Stripe/email fields stripped, for the paid result page.
export interface ContractScanPublicRecord {
  id: string
  status: ContractScanStatus
  progress: number
  step: string
  paid: boolean
  result?: ContractScanResult
  error?: string
  createdAt: string
  updatedAt: string
}
