import { describe, expect, it } from 'vitest'
import { minimarkToMarkdown } from '../../server/utils/minimark-markdown'

const SITE = 'https://ravy.pro'

describe('minimarkToMarkdown', () => {
  it('renders headings, paragraphs, and inline markup', () => {
    const body = {
      type: 'minimark',
      value: [
        ['h2', { id: 'intro' }, 'Intro'],
        ['p', {}, 'Hello ', ['strong', {}, 'world'], '!'],
      ],
    }
    expect(minimarkToMarkdown(body, SITE)).toBe('## Intro\n\nHello **world**!')
  })

  it('keeps heading levels distinct so section structure survives', () => {
    const body = {
      type: 'minimark',
      value: [
        ['h1', {}, 'Title'],
        ['h2', {}, 'Section'],
        ['h3', {}, 'Subsection'],
      ],
    }
    expect(minimarkToMarkdown(body, SITE)).toBe('# Title\n\n## Section\n\n### Subsection')
  })

  it('absolutizes relative links and images', () => {
    const body = {
      type: 'minimark',
      value: [
        ['p', {}, ['a', { href: '/blogs/other' }, 'link']],
        ['img', { src: '/blog-content/a.webp', alt: 'pic' }],
      ],
    }
    const md = minimarkToMarkdown(body, SITE)
    expect(md).toContain('[link](https://ravy.pro/blogs/other)')
    expect(md).toContain('![pic](https://ravy.pro/blog-content/a.webp)')
  })

  it('leaves absolute and protocol-relative URLs alone', () => {
    const body = {
      type: 'minimark',
      value: [['p', {}, ['a', { href: 'https://example.com/x' }, 'ext']]],
    }
    expect(minimarkToMarkdown(body, SITE)).toContain('[ext](https://example.com/x)')
  })

  it('renders unordered and ordered lists with the right markers', () => {
    const body = {
      type: 'minimark',
      value: [
        ['ul', {}, ['li', {}, 'one'], ['li', {}, 'two']],
        ['ol', {}, ['li', {}, 'first'], ['li', {}, 'second']],
      ],
    }
    const md = minimarkToMarkdown(body, SITE)
    expect(md).toContain('- one\n- two')
    expect(md).toContain('1. first\n2. second')
  })

  it('fences code blocks with their language', () => {
    const body = {
      type: 'minimark',
      value: [['pre', { language: 'ts', code: 'const a = 1\n' }, ['code', {}, 'const a = 1']]],
    }
    expect(minimarkToMarkdown(body, SITE)).toBe('```ts\nconst a = 1\n```')
  })

  it('renders inline code with backticks', () => {
    const body = { type: 'minimark', value: [['p', {}, 'use ', ['code', {}, 'npm run dev']]] }
    expect(minimarkToMarkdown(body, SITE)).toBe('use `npm run dev`')
  })

  it('prefixes blockquote lines', () => {
    const body = { type: 'minimark', value: [['blockquote', {}, ['p', {}, 'quoted']]] }
    expect(minimarkToMarkdown(body, SITE)).toBe('> quoted')
  })

  it('unwraps unknown/custom component tags but keeps their children', () => {
    const body = { type: 'minimark', value: [['MyWidget', { foo: 1 }, ['p', {}, 'inner']]] }
    expect(minimarkToMarkdown(body, SITE)).toBe('inner')
  })

  it('does not emit raw HTML tags', () => {
    const body = {
      type: 'minimark',
      value: [['p', {}, 'a ', ['em', {}, 'b'], ' c'], ['hr', {}]],
    }
    const md = minimarkToMarkdown(body, SITE)
    expect(md).not.toMatch(/<[a-z]/i)
  })

  it('collapses runs of blank lines', () => {
    const body = {
      type: 'minimark',
      value: [['p', {}, 'one'], ['p', {}, 'two'], ['p', {}, 'three']],
    }
    expect(minimarkToMarkdown(body, SITE)).toBe('one\n\ntwo\n\nthree')
  })

  it('returns empty string for missing or non-minimark bodies', () => {
    expect(minimarkToMarkdown(null, SITE)).toBe('')
    expect(minimarkToMarkdown({}, SITE)).toBe('')
    expect(minimarkToMarkdown({ type: 'root', children: [] }, SITE)).toBe('')
  })
})
