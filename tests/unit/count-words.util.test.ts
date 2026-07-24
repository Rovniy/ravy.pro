import { describe, expect, it } from 'vitest'
import { countWords, readingTimeMinutes } from '../../utils/count-words'

describe('countWords', () => {
  it('counts words in a minimark body (content v3)', () => {
    const body = {
      type: 'minimark',
      value: [
        ['h2', { id: 'intro' }, 'The problem this solves'],
        ['p', {}, 'I have ', ['strong', {}, '258 markdown'], ' notes in one vault.'],
        ['pre', { language: 'ts' }, ['code', {}, 'const a = 1']],
      ],
    }
    // h2: 4 + p: (2 + 2 + 4) + code: 4 = 16
    expect(countWords(body)).toBe(16)
  })

  it('counts words in the legacy AST shape', () => {
    const body = {
      type: 'root',
      children: [
        { type: 'element', tag: 'p', children: [{ type: 'text', value: 'hello brave new world' }] },
      ],
    }
    expect(countWords(body)).toBe(4)
  })

  it('returns 0 for empty or unknown input', () => {
    expect(countWords({})).toBe(0)
    expect(countWords(null)).toBe(0)
    expect(countWords(undefined)).toBe(0)
    expect(countWords({ type: 'minimark', value: [] })).toBe(0)
  })

  it('ignores props objects and collapses whitespace', () => {
    expect(countWords(['p', { class: 'x y z' }, '  spaced   out  '])).toBe(2)
  })
})

describe('readingTimeMinutes', () => {
  it('never returns below 1 minute', () => {
    expect(readingTimeMinutes(0)).toBe(1)
    expect(readingTimeMinutes(150)).toBe(1)
  })

  it('rounds up at 200 wpm', () => {
    expect(readingTimeMinutes(201)).toBe(2)
    expect(readingTimeMinutes(2600)).toBe(13)
  })
})
