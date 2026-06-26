// Per-user, per-tool access grants. Grants are keyed by normalized email so the
// admin can grant access before a user has ever signed in.

export interface AccessGrant {
  email: string
  tools: string[]
  updatedAt: string
  updatedBy?: string
}

// Returned to the browser to drive nav + in-page gating. `isAdmin` is the
// server-confirmed admin flag; `tools` are the gated tool keys this user may use
// (all keys when admin).
export interface AccessSummary {
  isAdmin: boolean
  tools: string[]
}

// Row in the admin access manager: a known user (has signed in) and/or an email
// that has been granted tools.
export interface ManagedAccount {
  email: string
  displayName?: string
  tools: string[]
  hasSignedIn: boolean
}

// One immutable entry in the access audit log.
export interface AccessAuditEntry {
  id: string
  createdAt: string
  action: 'set' | 'revoke'
  targetEmail: string
  oldTools: string[]
  newTools: string[]
  adminEmail?: string
  adminUid?: string
}
