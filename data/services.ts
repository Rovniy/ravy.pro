// Single source of truth for access-gated tools. Adding a new gated tool here
// makes it appear automatically in the admin access manager (checkboxes), in the
// header "Services" menu (for users who have it), and it just needs a matching
// `requireToolAccess(event, key)` guard on its API + an in-page access check.

export interface GatedTool {
  key: string
  name: string
  path: string
  icon: string
}

export const GATED_TOOLS: GatedTool[] = [
  { key: 'shortify', name: 'Shortify', path: '/shortify', icon: 'mdi:link-variant' },
  { key: 'contract-scanner', name: 'Contract Red-Flag Scanner', path: '/tools/contract-red-flag-scanner', icon: 'mdi:shield-search' },
]

export const GATED_TOOL_KEYS: string[] = GATED_TOOLS.map(t => t.key)

export function isValidToolKey(key: string): boolean {
  return GATED_TOOL_KEYS.includes(key)
}
