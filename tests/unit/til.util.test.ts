import type { TilNoteMeta } from '~/utils/til'
import { describe, expect, it } from 'vitest'
import { BlogPostTag } from '~/data'
import { TIL_TOPIC_IDS, TIL_TOPICS, tilTopicPath } from '~/data/til'
import { INDEXNOW_KEY, indexNowPayload } from '~/utils/indexnow'
import {
  excerptOf,
  linkedInPost,
  normalizeNote,
  noteFromDoc,
  notePingPaths,
  noteSlugFromPath,
  noteWarnings,
  plainText,
  relatedNotes,
  TilNoteValidationError,
  topicCounts,
  xPost,
} from '~/utils/til'

const NOW = '2026-10-12T12:00:00.000Z'
const valid = {
  slug: 'unity-addressables-local',
  title: 'How to load Unity Addressables from a local server',
  topics: ['unity'],
  markdown: 'Point the remote load path at localhost.\n\n```csharp\nAddressables.LoadContentCatalogAsync(url);\n```\n\nSource: https://docs.unity3d.com',
}

function meta(slug: string, topics: string[], createdAt: string): TilNoteMeta {
  return { slug, path: `/til/${slug}`, title: slug, topics, excerpt: '', published: true, createdAt, lastUpdated: createdAt }
}

describe('topics registry', () => {
  it('has unique ids, real blog categories and unique hub copy', () => {
    expect(new Set(TIL_TOPIC_IDS).size).toBe(TIL_TOPIC_IDS.length)
    for (const t of TIL_TOPICS) {
      if (t.category)
        expect(BlogPostTag, t.id).toContain(t.category)
      expect(t.description.length, t.id).toBeGreaterThanOrEqual(100)
      expect(t.description.length, t.id).toBeLessThanOrEqual(200)
      expect(t.hashtags.length, t.id).toBeGreaterThan(0)
    }
    expect(new Set(TIL_TOPICS.map(t => t.description)).size).toBe(TIL_TOPICS.length)
  })
})

describe('plainText / excerptOf', () => {
  it('drops code blocks, keeps link labels and inline code text', () => {
    expect(plainText('Use **`pnpm`** with [the docs](https://x.y).\n\n```bash\nrm -rf /\n```\n- item')).toBe('Use pnpm with the docs. item')
  })

  it('cuts at a word boundary under 160 characters', () => {
    const e = excerptOf('word '.repeat(80))
    expect(e.length).toBeLessThanOrEqual(160)
    expect(e.endsWith('…')).toBe(true)
    expect(e).not.toMatch(/ …$/)
  })

  it('falls back when the body is only code', () => {
    expect(excerptOf('```ts\nx\n```', 'The title')).toBe('The title')
  })
})

describe('normalizeNote', () => {
  it('builds a stored note with its path and excerpt', () => {
    const note = normalizeNote(valid, { now: NOW })
    expect(note).toMatchObject({ path: '/til/unity-addressables-local', published: false, createdAt: NOW, lastUpdated: NOW })
    expect(note.excerpt).toBe('Point the remote load path at localhost. Source: https://docs.unity3d.com')
  })

  it('keeps the path and creation date of an existing note', () => {
    const existing = { ...normalizeNote(valid, { now: '2026-01-01T00:00:00.000Z' }), path: '/til/old-path' }
    const note = normalizeNote({ ...valid, title: 'New title?' }, { now: NOW, existing })
    expect(note.path).toBe('/til/old-path')
    expect(note.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it.each([
    [{ slug: 'topic' }, /reserved/],
    [{ slug: 'Bad Slug' }, /Slug/],
    [{ title: '' }, /Title/],
    [{ title: 'x'.repeat(111) }, /under 110/],
    [{ topics: [] }, /topic/],
    [{ topics: ['crypto'] }, /Unknown topic/],
    [{ markdown: '  ' }, /empty/],
    [{ markdown: 'x'.repeat(4001) }, /blog post/],
    [{ createdAt: '2027-01-01T00:00:00.000Z' }, /future/],
    [{ markdown: '<iframe src="https://youtube.com/embed/x"></iframe>' }, /title/],
  ])('rejects %o', (patch, message) => {
    expect(() => normalizeNote({ ...valid, ...patch }, { now: NOW })).toThrow(TilNoteValidationError)
    expect(() => normalizeNote({ ...valid, ...patch }, { now: NOW })).toThrow(message)
  })

  it('only publishes on an explicit true', () => {
    expect(normalizeNote({ ...valid, published: 'yes' }, { now: NOW }).published).toBe(false)
    expect(normalizeNote({ ...valid, published: true }, { now: NOW }).published).toBe(true)
  })
})

describe('noteFromDoc', () => {
  it('drops unknown topics and survives a doc without an excerpt', () => {
    const note = noteFromDoc({ title: 'T', topics: ['ai', 'gone'], markdown: 'Hello there' }, 'slug')
    expect(note).toMatchObject({ path: '/til/slug', topics: ['ai'], excerpt: 'Hello there' })
    expect(noteFromDoc({ markdown: 'x' }, 's')).toBeNull()
  })
})

describe('relatedNotes / topicCounts', () => {
  const all = [
    meta('a', ['unity'], '2026-01-01'),
    meta('b', ['unity', 'gamedev'], '2026-02-01'),
    meta('c', ['ai'], '2026-03-01'),
    meta('d', ['gamedev'], '2026-04-01'),
  ]

  it('prefers more shared topics, then newer, and skips the note itself', () => {
    expect(relatedNotes({ slug: 'x', topics: ['unity', 'gamedev'] }, all).map(n => n.slug)).toEqual(['b', 'd', 'a'])
    expect(relatedNotes({ slug: 'b', topics: ['unity'] }, all).map(n => n.slug)).toEqual(['a'])
  })

  it('counts notes per topic', () => {
    expect(topicCounts(all)).toEqual({ unity: 2, gamedev: 2, ai: 1 })
  })
})

describe('noteWarnings', () => {
  it('is quiet for a well-formed note', () => {
    expect(noteWarnings(valid)).toEqual([])
  })

  it('asks for code or a source, more substance, and English', () => {
    const w = noteWarnings({ title: 'Как сделать', markdown: 'Just do it.' })
    expect(w.some(x => x.includes('No code'))).toBe(true)
    expect(w.some(x => x.includes('Very short'))).toBe(true)
    expect(w.some(x => x.includes('Cyrillic'))).toBe(true)
  })
})

describe('share texts', () => {
  const note = { title: 'How to load Unity Addressables from a local server', excerpt: 'Point it at localhost.', topics: ['unity', 'gamedev'] }
  const url = 'https://ravy.pro/til/unity-addressables-local'

  it('linkedIn post has the question, the link and hashtags', () => {
    const text = linkedInPost(note, url)
    expect(text.startsWith(`TIL: ${note.title}`)).toBe(true)
    expect(text).toContain(url)
    expect(text).toContain('#Unity')
    expect(new Set(text.match(/#\w+/g)).size).toBe(text.match(/#\w+/g)!.length)
  })

  it('x post fits in 280 counting the link as 23', () => {
    const long = { ...note, title: 'x'.repeat(300) }
    for (const n of [note, long]) {
      const text = xPost(n, url)
      expect(text.replace(url, 'u'.repeat(23)).length).toBeLessThanOrEqual(280)
      expect(text).toContain(url)
    }
  })
})

describe('paths', () => {
  it('maps note paths and ping targets', () => {
    expect(noteSlugFromPath('/til/abc')).toBe('abc')
    expect(noteSlugFromPath('/til/topic')).toBe('')
    expect(noteSlugFromPath('/blogs/abc')).toBe('')
    expect(notePingPaths({ path: '/til/abc', topics: ['ai', 'web'] })).toEqual(['/til/abc', '/til', tilTopicPath('ai'), tilTopicPath('web')])
  })

  it('builds the IndexNow payload with absolute, unique urls', () => {
    expect(indexNowPayload('https://ravy.pro/', ['/til', '/til', 'https://ravy.pro/x'])).toEqual({
      host: 'ravy.pro',
      key: INDEXNOW_KEY,
      keyLocation: 'https://ravy.pro/indexnow-key.txt',
      urlList: ['https://ravy.pro/til', 'https://ravy.pro/x'],
    })
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/)
  })
})
