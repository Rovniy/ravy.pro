import type { CommandItem } from '~/utils/command-search'
import { describe, expect, it } from 'vitest'
import { highlightParts, mergeRanges, normalize, searchCommands, swapLayout, tokenize } from '~/utils/command-search'

function item(id: string, title: string, extra: Partial<CommandItem> = {}): CommandItem {
  return {
    id,
    type: 'page',
    title,
    icon: 'mdi:file',
    actions: [{ label: 'Open', kind: 'navigate', value: `/${id}` }],
    ...extra,
  }
}

const ITEMS = [
  item('games', 'Games'),
  item('games-music', 'Games and music'),
  item('jwt', 'JWT Decoder', { type: 'tool', keywords: ['token', 'токен'] }),
  item('tiny', 'Tiny Boo: Homecoming', { type: 'game' }),
  item('tiny-press', 'Tiny Boo: Homecoming press kit', { type: 'game' }),
  item('ёлка', 'Ёлка'),
  item('boost', 'Unity build boost', { type: 'post', priority: 3 }),
]

const ids = (q: string) => searchCommands(ITEMS, q).hits.map(h => h.item.id)

describe('normalize / tokenize', () => {
  it('lowercases, strips diacritics and folds ё', () => {
    expect(normalize('Ёлка Café')).toBe('елка cafe')
    expect(normalize('Ёлка Café')).toHaveLength('Ёлка Café'.length)
  })

  it('splits on spaces and commas', () => {
    expect(tokenize('  Tiny,  boo ')).toEqual(['tiny', 'boo'])
  })
})

describe('swapLayout', () => {
  it('retypes a query typed on the wrong keyboard layout, both ways', () => {
    expect(swapLayout('ештн ищщ')).toBe('tiny boo')
    expect(swapLayout('ghbdtn')).toBe('привет')
  })

  it('returns null when there is nothing to swap', () => {
    expect(swapLayout('123 !')).toBeNull()
  })
})

describe('searchCommands', () => {
  it('ranks exact over prefix over word-start over substring', () => {
    expect(ids('games')[0]).toBe('games')
    expect(ids('games')[1]).toBe('games-music')
    expect(ids('decoder')).toEqual(['jwt'])
  })

  it('requires every token to match', () => {
    expect(ids('tiny press')).toEqual(['tiny-press'])
    expect(ids('tiny')).toEqual(['tiny', 'tiny-press'])
  })

  it('finds by keywords, including Russian synonyms', () => {
    expect(ids('токен')).toEqual(['jwt'])
  })

  it('matches ё as е', () => {
    expect(ids('елка')).toEqual(['ёлка'])
  })

  it('falls back to a fuzzy in-order match for longer tokens only', () => {
    expect(ids('jwtdec')).toEqual(['jwt'])
    expect(ids('ae')).toEqual([])
  })

  it('retries on the other layout and reports the correction', () => {
    const r = searchCommands(ITEMS, 'ештн')
    expect(r.correctedQuery).toBe('tiny')
    expect(r.hits.map(h => h.item.id)).toEqual(['tiny', 'tiny-press'])
  })

  it('does not report a correction when the query matched as typed', () => {
    expect(searchCommands(ITEMS, 'tiny').correctedQuery).toBeUndefined()
  })

  it('orders the empty query by priority', () => {
    expect(searchCommands(ITEMS, '   ').hits[0]!.item.id).toBe('boost')
  })

  it('returns title ranges to highlight', () => {
    const hit = searchCommands(ITEMS, 'boo home').hits[0]!
    expect(hit.item.id).toBe('tiny')
    expect(highlightParts(hit.item.title, hit.ranges).filter(p => p.match).map(p => p.text)).toEqual(['Boo', 'Home'])
  })
})

describe('mergeRanges / highlightParts', () => {
  it('merges overlapping and adjacent ranges', () => {
    expect(mergeRanges([[4, 6], [0, 2], [2, 3], [5, 8]])).toEqual([[0, 3], [4, 8]])
  })

  it('splits text into plain and matched runs', () => {
    expect(highlightParts('JWT Decoder', [[4, 7]])).toEqual([
      { text: 'JWT ', match: false },
      { text: 'Dec', match: true },
      { text: 'oder', match: false },
    ])
  })
})
