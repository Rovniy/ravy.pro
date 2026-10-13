import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeFirestore } from '../helpers/fake-firestore'

/**
 * The blog and TIL stores share one contract: a memoised single-document index
 * that serves a stale copy when Firestore fails, and saves that keep that index
 * in step with the documents. Run the same scenarios against both.
 */

let fake = createFakeFirestore()

vi.mock('~~/server/utils/firebase-admin', () => ({ getDb: () => fake.db }))
vi.mock('~~/server/utils/report-error', () => ({ reportServerEvent: vi.fn(), reportServerError: vi.fn() }))

interface Item { slug: string, title: string, published: boolean, createdAt: string }

interface StoreUnderTest {
  name: string
  collection: string
  load: () => Promise<{
    list: (opts?: { publishedOnly?: boolean, fresh?: boolean }) => Promise<Item[]>
    getMany: (slugs: string[]) => Promise<Item[]>
    save: (record: never) => Promise<void>
    remove: (slug: string) => Promise<void>
    rebuild: () => Promise<Item[]>
  }>
  record: (slug: string, createdAt: string, published?: boolean) => Record<string, unknown>
}

const stores: StoreUnderTest[] = [
  {
    name: 'blog-store',
    collection: 'blog_posts',
    load: async () => {
      const m = await import('~~/server/utils/blog-store')
      return { list: m.listMeta, getMany: m.getPosts, save: m.savePost as never, remove: m.deletePost, rebuild: m.rebuildIndex }
    },
    record: (slug, createdAt, published = true) => ({
      path: `/blogs/${slug}`,
      slug,
      title: `Post ${slug}`,
      description: 'd',
      image: '/i.webp',
      ogImage: '/i.webp',
      alt: 'a',
      tags: ['unity'],
      published,
      trending: false,
      noindex: false,
      theme: '',
      locale: 'en_US',
      createdAt,
      lastUpdated: createdAt,
      markdown: `Body of ${slug}`,
    }),
  },
  {
    name: 'til-store',
    collection: 'til_notes',
    load: async () => {
      const m = await import('~~/server/utils/til-store')
      return { list: m.listNotes, getMany: m.getNotes, save: m.saveNote as never, remove: m.deleteNote, rebuild: m.rebuildNoteIndex }
    },
    record: (slug, createdAt, published = true) => ({
      path: `/til/${slug}`,
      slug,
      title: `Note ${slug}`,
      topics: ['web'],
      excerpt: 'e',
      published,
      createdAt,
      lastUpdated: createdAt,
      markdown: `Body of ${slug}`,
    }),
  },
]

beforeEach(() => {
  fake = createFakeFirestore()
  vi.resetModules()
})

describe.each(stores)('$name', (s) => {
  async function seed(...records: Record<string, unknown>[]) {
    for (const r of records)
      fake.docs.set(`${s.collection}/${r.slug}`, r)
    const store = await s.load()
    await store.rebuild()
    vi.resetModules()
    fake.state.reads = 0
    return s.load()
  }

  it('lists newest first and filters drafts', async () => {
    const store = await seed(s.record('a', '2026-01-01'), s.record('b', '2026-03-01'), s.record('c', '2026-02-01', false))
    expect((await store.list()).map(i => i.slug)).toEqual(['b', 'c', 'a'])
    expect((await store.list({ publishedOnly: true })).map(i => i.slug)).toEqual(['b', 'a'])
  })

  it('reads the index once per TTL', async () => {
    const store = await seed(s.record('a', '2026-01-01'))
    await store.list()
    await store.list()
    await store.list({ publishedOnly: true })
    expect(fake.state.reads).toBe(1)
  })

  it('serves the stale copy when Firestore fails, and throws when it has none', async () => {
    const store = await seed(s.record('a', '2026-01-01'))
    await store.list()
    fake.state.failing = true
    expect((await store.list({ fresh: true })).map(i => i.slug)).toEqual(['a'])

    vi.resetModules()
    const cold = await s.load()
    await expect(cold.list()).rejects.toThrow('firestore unavailable')
  })

  it('adds a new record to the index without reading every document', async () => {
    const store = await seed(s.record('a', '2026-01-01'), s.record('b', '2026-02-01'), s.record('c', '2026-03-01'))
    await store.save(s.record('d', '2026-04-01') as never)
    expect(fake.state.reads).toBeLessThanOrEqual(1)

    vi.resetModules()
    const reloaded = await s.load()
    expect((await reloaded.list()).map(i => i.slug)).toEqual(['d', 'c', 'b', 'a'])
  })

  it('replaces an edited record in place instead of duplicating it', async () => {
    const store = await seed(s.record('a', '2026-01-01'), s.record('b', '2026-02-01'))
    await store.save({ ...s.record('a', '2026-01-01'), title: 'Renamed' } as never)

    vi.resetModules()
    const list = await (await s.load()).list()
    expect(list.map(i => i.slug)).toEqual(['b', 'a'])
    expect(list.find(i => i.slug === 'a')?.title).toBe('Renamed')
    expect(list[0]).not.toHaveProperty('markdown')
  })

  it('removes a deleted record from the index and the collection', async () => {
    const store = await seed(s.record('a', '2026-01-01'), s.record('b', '2026-02-01'))
    await store.remove('a')
    expect(fake.docs.has(`${s.collection}/a`)).toBe(false)

    vi.resetModules()
    expect((await (await s.load()).list()).map(i => i.slug)).toEqual(['b'])
  })

  it('builds the index from the collection when it does not exist yet', async () => {
    fake.docs.set(`${s.collection}/a`, s.record('a', '2026-01-01'))
    const store = await s.load()
    await store.save(s.record('b', '2026-02-01') as never)

    vi.resetModules()
    expect((await (await s.load()).list()).map(i => i.slug)).toEqual(['b', 'a'])
  })

  it('reads several records in one round trip, in order, skipping missing ones', async () => {
    const store = await seed(s.record('a', '2026-01-01'), s.record('b', '2026-02-01'))
    const items = await store.getMany(['b', 'missing', 'a'])
    expect(items.map(i => i.slug)).toEqual(['b', 'a'])
    expect(fake.state.reads).toBe(3)
  })
})
