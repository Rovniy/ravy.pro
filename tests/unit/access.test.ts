import { describe, expect, it } from 'vitest'
import { GATED_TOOL_KEYS, GATED_TOOLS, isValidToolKey } from '../../data/services'
import { decideToolAccess } from '../../server/utils/access'

describe('access — decideToolAccess', () => {
  it('admin can access any tool, even unknown keys', () => {
    expect(decideToolAccess(true, [], 'shortify')).toBe(true)
    expect(decideToolAccess(true, [], 'anything')).toBe(true)
  })

  it('grantee can access only granted tools', () => {
    expect(decideToolAccess(false, ['shortify'], 'shortify')).toBe(true)
    expect(decideToolAccess(false, ['shortify'], 'contract-scanner')).toBe(false)
  })

  it('no grants → no access', () => {
    expect(decideToolAccess(false, [], 'shortify')).toBe(false)
  })
})

describe('access — tool registry', () => {
  it('has unique keys and exposes them', () => {
    const keys = GATED_TOOLS.map(t => t.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(GATED_TOOL_KEYS).toEqual(keys)
  })

  it('validates known and rejects unknown keys', () => {
    expect(isValidToolKey('shortify')).toBe(true)
    expect(isValidToolKey('contract-scanner')).toBe(true)
    expect(isValidToolKey('nope')).toBe(false)
  })
})
