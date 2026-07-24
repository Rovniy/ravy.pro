/**
 * Counts words in a @nuxt/content document body.
 *
 * Content v3 stores bodies in the "minimark" format: the body is
 * `{ type: 'minimark', value: [...] }` and each node is either a plain
 * string (text) or a `[tag, props, ...children]` tuple. The legacy AST
 * shape (`{ type: 'text', value }` / `{ children: [] }`) is still handled
 * so the function works with either representation.
 */
export function countWords(node: unknown): number {
  if (typeof node === 'string')
    return node.split(/\s+/).filter(Boolean).length

  if (Array.isArray(node)) {
    // Minimark element tuple: [tag, props, ...children]; the first two
    // entries are never text. A bare array of nodes has no string/props
    // prefix, but slicing two leading non-string entries is only valid for
    // tuples — detect a tuple by its string tag.
    const children = typeof node[0] === 'string' && node.length >= 2 && typeof node[1] === 'object' && !Array.isArray(node[1])
      ? node.slice(2)
      : node
    return children.reduce((sum: number, child) => sum + countWords(child), 0)
  }

  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (obj.type === 'minimark' && Array.isArray(obj.value))
      return obj.value.reduce((sum: number, child) => sum + countWords(child), 0)
    if (obj.type === 'text' && typeof obj.value === 'string')
      return countWords(obj.value)
    if (Array.isArray(obj.children))
      return obj.children.reduce((sum: number, child) => sum + countWords(child), 0)
    if (Array.isArray(obj.value))
      return obj.value.reduce((sum: number, child) => sum + countWords(child), 0)
  }

  return 0
}

/** Reading time in whole minutes at ~200 wpm, never below 1. */
export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200))
}
