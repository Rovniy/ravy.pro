import { describe, expect, it } from 'vitest'
import {
  BlogPostValidationError,
  isValidSlug,
  normalizeRecord,
  postPath,
  recordFromDoc,
  slugFromPath,
  slugify,
  sortByCreatedDesc,
  toCardData,
  toMeta,
} from '~~/utils/blog-post'

const NOW = '2026-08-11T10:00:00.000Z'

function payload(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'a-post',
    title: 'A Post',
    description: 'What it is about',
    image: '/media/blog/a-post/cover.webp',
    tags: ['dev'],
    markdown: '## Heading\n\nBody.',
    ...overrides,
  }
}

describe('slugs', () => {
  it('accepts lowercase hyphenated slugs only', () => {
    expect(isValidSlug('hello-world-2')).toBe(true)
    expect(isValidSlug('Hello')).toBe(false)
    expect(isValidSlug('hello--world')).toBe(false)
    expect(isValidSlug('-hello')).toBe(false)
    expect(isValidSlug('hello-')).toBe(false)
    expect(isValidSlug('')).toBe(false)
  })

  it('slugifies titles to ascii', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('  Trailing --- hyphens  ')).toBe('trailing-hyphens')
    expect(slugify('Café Déjà vu')).toBe('cafe-deja-vu')
  })

  it('round-trips a path', () => {
    expect(postPath('a-post')).toBe('/blogs/a-post')
    expect(slugFromPath('/blogs/a-post')).toBe('a-post')
    expect(slugFromPath('/docs/a-post')).toBe('')
  })
})

describe('normalizeRecord', () => {
  it('fills the derived fields', () => {
    const record = normalizeRecord(payload(), { now: NOW })
    expect(record.path).toBe('/blogs/a-post')
    // ogImage falls back to the cover and alt to the description, so a post is
    // never shared with a missing image or an empty alt.
    expect(record.ogImage).toBe(record.image)
    expect(record.alt).toBe('What it is about')
    expect(record.locale).toBe('en_US')
    expect(record.lastUpdated).toBe(NOW)
    expect(record.createdAt).toBe(NOW)
  })

  it('requires title, description, cover, tags and a body', () => {
    for (const missing of ['title', 'description', 'image', 'markdown'] as const)
      expect(() => normalizeRecord(payload({ [missing]: '' }), { now: NOW })).toThrow(BlogPostValidationError)
    expect(() => normalizeRecord(payload({ tags: [] }), { now: NOW })).toThrow(BlogPostValidationError)
  })

  it('rejects reserved and malformed slugs', () => {
    expect(() => normalizeRecord(payload({ slug: 'new' }), { now: NOW })).toThrow(/reserved/)
    expect(() => normalizeRecord(payload({ slug: 'Not A Slug' }), { now: NOW })).toThrow(BlogPostValidationError)
  })

  /*
   * The URL is the one thing an edit must never move. `path` comes from the
   * existing record, so re-sending a different slug cannot repoint a published
   * post — which is also why the studio disables the field after creation.
   */
  it('keeps the original path and createdAt when updating', () => {
    const existing = normalizeRecord(payload(), { now: '2026-01-01T00:00:00.000Z' })
    const updated = normalizeRecord(payload({ slug: 'a-post', title: 'Renamed' }), { now: NOW, existing })
    expect(updated.path).toBe('/blogs/a-post')
    expect(updated.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(updated.lastUpdated).toBe(NOW)
  })

  // One post once shipped `article:modified_time` earlier than
  // `article:published_time`; a future createdAt is how that happens now.
  it('rejects a createdAt in the future', () => {
    expect(() => normalizeRecord(payload({ createdAt: '2030-01-01T00:00:00.000Z' }), { now: NOW }))
      .toThrow(/future/)
  })

  it('rejects an embed that would break the mobile layout', () => {
    const withSizedIframe = payload({
      markdown: '<iframe src="https://www.youtube.com/embed/x" title="v" width="720" height="405"></iframe>',
    })
    expect(() => normalizeRecord(withSizedIframe, { now: NOW })).toThrow(/width\/height/)
  })

  it('drops duplicate and blank tags', () => {
    const record = normalizeRecord(payload({ tags: ['dev', 'dev', '  ', 'ai'] }), { now: NOW })
    expect(record.tags).toEqual(['dev', 'ai'])
  })

  it('defaults every boolean flag to false', () => {
    const record = normalizeRecord(payload(), { now: NOW })
    expect([record.published, record.trending, record.noindex]).toEqual([false, false, false])
  })
})

describe('recordFromDoc', () => {
  // A document written by an older version of the panel has to render rather
  // than 500 the blog, so this coerces instead of throwing.
  it('fills missing fields instead of failing', () => {
    const record = recordFromDoc({ title: 'T' }, 'a-post')
    expect(record?.path).toBe('/blogs/a-post')
    expect(record?.image).toBe('/not-found.png')
    expect(record?.alt).toBe('T')
    expect(record?.tags).toEqual([])
  })

  it('returns null for a document with no title', () => {
    expect(recordFromDoc({}, 'a-post')).toBeNull()
    expect(recordFromDoc(undefined, 'a-post')).toBeNull()
  })
})

describe('list helpers', () => {
  it('strips the body for the index', () => {
    const record = normalizeRecord(payload(), { now: NOW })
    expect('markdown' in toMeta(record)).toBe(false)
  })

  it('sorts newest first and puts undated posts last', () => {
    const sorted = sortByCreatedDesc([
      { createdAt: '', title: 'Undated' },
      { createdAt: '2026-01-01', title: 'Old' },
      { createdAt: '2026-06-01', title: 'New' },
    ])
    expect(sorted.map(p => p.title)).toEqual(['New', 'Old', 'Undated'])
  })

  it('gives cards a usable shape from an empty post', () => {
    const card = toCardData({})
    expect(card.image).toBe('/not-found.png')
    expect(card.ogImage).toBe('/not-found.png')
    expect(card.alt).toBe(card.description)
    expect(card.published).toBe(false)
  })
})
