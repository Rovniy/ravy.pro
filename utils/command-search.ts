// Search engine behind the ⌘K command palette. Pure and synchronous: the index
// is a few hundred items, so a linear scan with a hand-tuned scorer beats any
// fuzzy-search dependency on both bundle size and predictability.
//
// Ranking, best first: exact title → title prefix → word prefix in the title →
// substring in the title → keyword/subtitle hit → in-order fuzzy match on the
// title. Every query token must match somewhere, so "tiny press" narrows to
// the press kit instead of listing everything with "tiny" in it.
//
// Half the audience types on a Russian keyboard, so a query that finds nothing
// is retried through the ЙЦУКЕН ↔ QWERTY map ("ешт? ищщ" → "tiny boo").

export type CommandType = 'action' | 'page' | 'post' | 'note' | 'tool' | 'game' | 'music' | 'album' | 'service' | 'social'

export type CommandActionKind
  /** Internal route, through the router. */
  = | 'navigate'
  /** Another site, in a new tab. */
    | 'external'
  /** `mailto:` / `tel:` — left to the OS. */
    | 'mail'
  /** Puts `value` on the clipboard. */
    | 'copy'
  /** A client-side command handled by the palette (`value` is its id). */
    | 'run'

export interface CommandAction {
  /** Verb on the button: "Read", "Try", "Play on Spotify", "Write". */
  label: string
  kind: CommandActionKind
  /** URL, route, text to copy or command id, depending on `kind`. */
  value: string
  icon?: string
}

export interface CommandItem {
  /** Stable across sessions: used for recents and analytics. */
  id: string
  type: CommandType
  title: string
  /** One line under the title. */
  subtitle?: string
  /** Extra words that should find the item: tags, genres, synonyms, Russian names. */
  keywords?: string[]
  icon: string
  /** Same-origin thumbnail. */
  image?: string
  /** First is the primary (Enter), second the secondary (⌘/Ctrl+Enter). */
  actions: CommandAction[]
  /** Tie-breaker between equally good matches; also orders the empty state. */
  priority?: number
}

export interface SearchHit {
  item: CommandItem
  score: number
  /** [start, end) ranges in `item.title` to highlight. */
  ranges: Array<[number, number]>
}

export interface SearchResult {
  hits: SearchHit[]
  /** Set when nothing matched as typed and the keyboard-layout swap did. */
  correctedQuery?: string
}

/** Lowercase and strip diacritics (ё → е). Length-preserving for precomposed Latin and Cyrillic. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    // Combining marks only: "é" → "e", "ё" → "е", "й" → "и" — one code unit
    // each way, so highlight ranges still index the original title.
    .replace(/\p{M}/gu, '')
}

const EN = '`qwertyuiop[]asdfghjkl;\'zxcvbnm,./'
const RU = 'ёйцукенгшщзхъфывапролджэячсмитьбю.'
const EN_TO_RU = new Map([...EN].map((c, i) => [c, RU[i]!]))
const RU_TO_EN = new Map([...RU].map((c, i) => [c, EN[i]!]))

/**
 * Retypes a query on the other keyboard layout: "ешт? ищщ" ↔ "tiny boo".
 * Returns null when the text has no letters from either layout to swap.
 */
export function swapLayout(text: string): string | null {
  const lower = text.toLowerCase()
  const cyrillic = /\p{Script=Cyrillic}/u.test(lower)
  const map = cyrillic ? RU_TO_EN : EN_TO_RU
  if (!cyrillic && !/[a-z]/.test(lower))
    return null
  return [...lower].map(c => map.get(c) ?? c).join('')
}

export function tokenize(query: string): string[] {
  return normalize(query).split(/[\s,]+/).filter(Boolean)
}

/** Start indices of words in normalized text. */
function wordStarts(text: string): number[] {
  const starts: number[] = []
  for (let i = 0; i < text.length; i++) {
    if (/[\p{L}\p{N}]/u.test(text[i]!) && (i === 0 || !/[\p{L}\p{N}]/u.test(text[i - 1]!)))
      starts.push(i)
  }
  return starts
}

/** Characters of `token` in order inside `text`; returns their positions or null. */
function subsequence(text: string, token: string): number[] | null {
  const at: number[] = []
  let from = 0
  for (const ch of token) {
    const i = text.indexOf(ch, from)
    if (i === -1)
      return null
    at.push(i)
    from = i + 1
  }
  return at
}

interface TokenMatch { score: number, ranges: Array<[number, number]> }

function matchToken(title: string, starts: number[], extra: string, token: string): TokenMatch | null {
  if (title === token)
    return { score: 120, ranges: [[0, title.length]] }
  if (title.startsWith(token))
    return { score: 100, ranges: [[0, token.length]] }
  const wordStart = starts.find(s => title.startsWith(token, s))
  if (wordStart !== undefined)
    return { score: 80, ranges: [[wordStart, wordStart + token.length]] }
  const inside = title.indexOf(token)
  if (inside !== -1 && token.length >= 2)
    return { score: 55, ranges: [[inside, inside + token.length]] }
  if (extra.includes(token))
    return { score: token.length >= 3 ? 45 : 30, ranges: [] }
  // Fuzzy only for tokens long enough to mean something, and only when the
  // letters are reasonably close together: "jwtdec" finds "JWT Decoder", but
  // "ae" does not find every title containing an a and later an e.
  if (token.length >= 3) {
    const at = subsequence(title, token)
    if (at && at[at.length - 1]! - at[0]! < token.length * 3)
      return { score: 20, ranges: at.map(i => [i, i + 1] as [number, number]) }
  }
  return null
}

/** Merges overlapping and adjacent ranges, sorted. */
export function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const out: Array<[number, number]> = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r[0] <= last[1])
      last[1] = Math.max(last[1], r[1])
    else
      out.push([r[0], r[1]])
  }
  return out
}

export function scoreItem(item: CommandItem, tokens: string[]): SearchHit | null {
  const title = normalize(item.title)
  const starts = wordStarts(title)
  const extra = normalize([item.subtitle, ...(item.keywords ?? [])].filter(Boolean).join(' · '))
  let score = 0
  const ranges: Array<[number, number]> = []
  for (const token of tokens) {
    const m = matchToken(title, starts, extra, token)
    if (!m)
      return null
    score += m.score
    ranges.push(...m.ranges)
  }
  // Shorter titles win among equal matches: "Games" before "Games and music".
  score += (item.priority ?? 0) - Math.min(title.length, 60) / 20
  return { item, score, ranges: mergeRanges(ranges) }
}

function rank(items: CommandItem[], tokens: string[], limit: number): SearchHit[] {
  const hits: SearchHit[] = []
  for (const item of items) {
    const hit = scoreItem(item, tokens)
    if (hit)
      hits.push(hit)
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function searchCommands(items: CommandItem[], query: string, limit = 40): SearchResult {
  const tokens = tokenize(query)
  if (!tokens.length) {
    const hits = [...items]
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      .slice(0, limit)
      .map(item => ({ item, score: 0, ranges: [] }))
    return { hits }
  }
  const hits = rank(items, tokens, limit)
  if (hits.length)
    return { hits }
  const swapped = swapLayout(query)
  if (swapped) {
    const retry = rank(items, tokenize(swapped), limit)
    if (retry.length)
      return { hits: retry, correctedQuery: swapped }
  }
  return { hits: [] }
}

/** Splits `text` into plain and highlighted runs for rendering. */
export function highlightParts(text: string, ranges: Array<[number, number]>): Array<{ text: string, match: boolean }> {
  const parts: Array<{ text: string, match: boolean }> = []
  let at = 0
  for (const [start, end] of ranges) {
    if (start > at)
      parts.push({ text: text.slice(at, start), match: false })
    parts.push({ text: text.slice(start, end), match: true })
    at = end
  }
  if (at < text.length)
    parts.push({ text: text.slice(at), match: false })
  return parts
}
