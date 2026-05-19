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

export interface ContractScanRecord {
  id: string
  ownerUid: string
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  step: string
  inputPreview?: string
  result?: ContractScanResult
  error?: string
  createdAt: string
  updatedAt: string
}
