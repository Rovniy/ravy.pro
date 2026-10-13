import { beforeEach, describe, expect, it, vi } from 'vitest'

// The parser is the expensive part; count how often it runs.
const parse = vi.fn(async (md: string) => ({ body: { type: 'root', children: [], md }, toc: { links: [] } }))

vi.mock('@nuxtjs/mdc/runtime', () => ({ createMarkdownParser: vi.fn(async () => parse) }))
vi.mock('#mdc-highlighter', () => ({ default: vi.fn() }))

beforeEach(() => {
  vi.resetModules()
  parse.mockClear()
})

describe('renderMarkdown cache', () => {
  it('parses a body once and serves the cached tree after', async () => {
    const { renderMarkdown } = await import('~~/server/utils/blog-render')
    const a = await renderMarkdown('# hi')
    const b = await renderMarkdown('# hi')
    expect(b).toBe(a)
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('treats CRLF and LF sources as the same body', async () => {
    const { renderMarkdown } = await import('~~/server/utils/blog-render')
    await renderMarkdown('a\r\nb')
    await renderMarkdown('a\nb')
    expect(parse).toHaveBeenCalledTimes(1)
  })

  it('evicts the least recently used body once the size budget is spent', async () => {
    const { renderMarkdown } = await import('~~/server/utils/blog-render')
    const big = (c: string) => c.repeat(900_000)
    await renderMarkdown(big('a'))
    await renderMarkdown(big('b'))
    await renderMarkdown(big('a')) // touch a: b is now the oldest
    await renderMarkdown(big('c')) // 2.7 M > 2 M: evicts b only
    parse.mockClear()

    await renderMarkdown(big('a'))
    await renderMarkdown(big('c'))
    expect(parse).not.toHaveBeenCalled()
    await renderMarkdown(big('b'))
    expect(parse).toHaveBeenCalledTimes(1)
  })
})
