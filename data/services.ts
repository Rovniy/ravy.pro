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

// NOTE: the Contract Red-Flag Scanner used to live here as a gated tool. It is
// now a public, paid tool (see `publicServices` in data/index.ts) — access to the
// full report is gated by Stripe payment, not by a per-user grant. Admins still
// get the full report for free via their `isAdmin` flag.
export const GATED_TOOLS: GatedTool[] = [
  { key: 'shortify', name: 'Shortify', path: '/shortify', icon: 'mdi:link-variant' },
]

export const GATED_TOOL_KEYS: string[] = GATED_TOOLS.map(t => t.key)

export function isValidToolKey(key: string): boolean {
  return GATED_TOOL_KEYS.includes(key)
}
