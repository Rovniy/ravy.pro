import { describe, expect, it, vi } from 'vitest'
import { daysSince, formatBlogDate, makeFirstCharUpper, tagColorClass } from '../../utils/helper'

describe('utils/helper', () => {
  it('makeFirstCharUpper handles empty and regular text', () => {
    expect(makeFirstCharUpper('')).toBe('')
    expect(makeFirstCharUpper('hello')).toBe('Hello')
  })

  it('tagColorClass is deterministic', () => {
    expect(tagColorClass('nuxt')).toBe(tagColorClass('nuxt'))
  })

  it('formatBlogDate handles invalid', () => {
    expect(formatBlogDate()).toBe('no-date')
    expect(formatBlogDate('bad-date')).toBe('no-date')
  })

  it('daysSince returns finite for valid date', () => {
    vi.setSystemTime(new Date('2026-05-20T00:00:00.000Z'))
    expect(daysSince('2026-05-19T00:00:00.000Z')).toBe(1)
    vi.useRealTimers()
  })
})
