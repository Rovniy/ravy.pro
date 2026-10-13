import type { TilNoteRecord } from '~~/utils/til'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The TIL routes and MCP tools against a mocked store, like blog.api.test.ts:
// what is public, what 404s, what a save does, and when search engines are
// pinged. Document shapes are covered by til.util.test.ts.

const mocks = vi.hoisted(() => ({
  notes: [] as TilNoteRecord[],
  saved: [] as TilNoteRecord[],
  pings: [] as string[][],
  slugParam: '',
  query: {} as Record<string, string>,
  body: undefined as unknown,
  toolAccessError: null as Error | null,
  headers: {} as Record<string, string>,
}))

vi.mock('~~/server/utils/til-store', () => ({
  listNotes: vi.fn(async (opts: { publishedOnly?: boolean } = {}) => mocks.notes
    .filter(n => !opts.publishedOnly || n.published)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(({ markdown: _m, ...meta }) => meta)),
  getNote: vi.fn(async (slug: string) => mocks.notes.find(n => n.slug === slug) ?? null),
  getNotes: vi.fn(async (slugs: string[]) => slugs.map(s => mocks.notes.find(n => n.slug === s)).filter(Boolean)),
  saveNote: vi.fn(async (note: TilNoteRecord) => {
    mocks.saved.push(note)
    mocks.notes = [...mocks.notes.filter(n => n.slug !== note.slug), note]
  }),
  deleteNote: vi.fn(async (slug: string) => {
    mocks.notes = mocks.notes.filter(n => n.slug !== slug)
  }),
}))
vi.mock('~~/server/utils/indexnow', () => ({
  pingIndexNow: vi.fn(async (paths: string[]) => {
    mocks.pings.push(paths)
  }),
}))
vi.mock('~~/server/utils/blog-render', () => ({
  renderMarkdown: vi.fn(async (md: string) => ({ type: 'root', children: [{ type: 'text', value: md }] })),
}))
vi.mock('~~/server/utils/blog-store', () => ({ listMeta: vi.fn(async () => []), getPost: vi.fn(async () => null), savePost: vi.fn() }))
vi.mock('~~/server/utils/blog-media', () => ({ putMedia: vi.fn() }))
vi.mock('~~/server/utils/rate-limit', () => ({ assertRateLimit: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/report-error', () => ({ reportServerEvent: vi.fn() }))
vi.mock('~~/server/utils/mcp/http', () => ({ applyMcpCors: () => false }))
vi.mock('~~/server/utils/mcp/oauth-store', () => ({
  siteOrigin: () => 'https://ravy.pro',
  resolveAccessToken: vi.fn(async () => ({ clientId: 'c', email: 'admin@example.com', uid: 'u1', resource: 'https://ravy.pro/mcp' })),
}))
vi.mock('~~/server/utils/access', () => ({
  hasToolAccess: vi.fn(async () => true),
  requireToolAccess: vi.fn(async () => {
    if (mocks.toolAccessError)
      throw mocks.toolAccessError
    return { uid: 'u1', email: 'admin@example.com' }
  }),
}))

function stubNitroGlobals() {
  vi.stubGlobal('setHeader', vi.fn())
  vi.stubGlobal('setResponseStatus', vi.fn())
  vi.stubGlobal('getRouterParam', () => mocks.slugParam)
  vi.stubGlobal('getQuery', () => mocks.query)
  vi.stubGlobal('readBody', async () => mocks.body)
  vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => mocks.headers[name.toLowerCase()])
  vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  })
}

function note(overrides: Partial<TilNoteRecord> = {}): TilNoteRecord {
  return {
    path: '/til/live',
    slug: 'live',
    title: 'How to do the live thing?',
    topics: ['unity'],
    excerpt: 'It works like this.',
    published: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    lastUpdated: '2026-05-01T00:00:00.000Z',
    markdown: 'It works like this.\n\n```ts\nx()\n```',
    ...overrides,
  }
}

const event = { method: 'POST' } as never

async function route(path: string) {
  return (await import(path)).default as (e: unknown) => Promise<any>
}

beforeEach(() => {
  mocks.notes = [
    note(),
    note({ slug: 'older', path: '/til/older', title: 'Older?', topics: ['unity', 'ai'], createdAt: '2026-04-01T00:00:00.000Z' }),
    note({ slug: 'ai-only', path: '/til/ai-only', title: 'AI only?', topics: ['ai'], createdAt: '2026-03-01T00:00:00.000Z' }),
    note({ slug: 'draft', path: '/til/draft', title: 'Draft?', published: false, createdAt: '2026-06-01T00:00:00.000Z' }),
  ]
  mocks.saved = []
  mocks.pings = []
  mocks.slugParam = ''
  mocks.query = {}
  mocks.body = undefined
  mocks.toolAccessError = null
  mocks.headers = { authorization: 'Bearer good' }
  stubNitroGlobals()
})

describe('public note routes', () => {
  it('lists published notes only', async () => {
    const list = await (await route('~~/server/api/til/notes.get'))(event)
    expect(list.map((n: { slug: string }) => n.slug)).toEqual(['live', 'older', 'ai-only'])
    expect(list[0].markdown).toBeUndefined()
  })

  it('serves a note with its body and related notes, and 404s drafts', async () => {
    const handler = await route('~~/server/api/til/note/[slug].get')
    mocks.slugParam = 'live'
    const res = await handler(event)
    expect(res.body.type).toBe('root')
    expect(res.markdown).toBeUndefined()
    expect(res.related.map((n: { slug: string }) => n.slug)).toEqual(['older'])

    mocks.slugParam = 'draft'
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
    mocks.slugParam = '../etc'
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('feeds rendered notes, splits the archive and scopes by topic', async () => {
    const handler = await route('~~/server/api/til/feed.get')
    mocks.query = { limit: '2' }
    const all = await handler(event)
    expect(all.notes.map((n: { slug: string }) => n.slug)).toEqual(['live', 'older'])
    expect(all.archive.map((n: { slug: string }) => n.slug)).toEqual(['ai-only'])
    expect(all.counts).toEqual({ unity: 2, ai: 2 })

    mocks.query = { topic: 'ai' }
    const ai = await handler(event)
    expect(ai.notes.map((n: { slug: string }) => n.slug)).toEqual(['older', 'ai-only'])
    expect(ai.total).toBe(2)

    mocks.query = { topic: 'crypto' }
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('studio note routes', () => {
  it('requires the studio grant', async () => {
    mocks.toolAccessError = Object.assign(new Error('Forbidden'), { statusCode: 403 })
    await expect((await route('~~/server/api/til/admin/notes.get'))(event)).rejects.toMatchObject({ statusCode: 403 })
    mocks.body = { slug: 'x', title: 'X?', topics: ['ai'], markdown: 'y' }
    await expect((await route('~~/server/api/til/admin/note.put'))(event)).rejects.toMatchObject({ statusCode: 403 })
    expect(mocks.saved).toHaveLength(0)
  })

  it('saves a draft without pinging search engines', async () => {
    mocks.body = { slug: 'new-one', title: 'How to new?', topics: ['web'], markdown: 'Do the thing.', mode: 'create' }
    const res = await (await route('~~/server/api/til/admin/note.put'))(event)
    expect(res).toMatchObject({ path: '/til/new-one', published: false })
    expect(res.warnings.length).toBeGreaterThan(0)
    expect(mocks.pings).toEqual([])
  })

  it('pings IndexNow when a note goes live or comes down', async () => {
    const put = await route('~~/server/api/til/admin/note.put')
    mocks.body = { ...note({ slug: 'draft', path: '/til/draft' }), published: true }
    await put(event)
    expect(mocks.pings[0]).toEqual(['/til/draft', '/til', '/til/topic/unity'])

    mocks.body = { ...note(), published: false }
    await put(event)
    expect(mocks.pings).toHaveLength(2)
  })

  it('refuses to create over an existing slug and reports validation as 400', async () => {
    const put = await route('~~/server/api/til/admin/note.put')
    mocks.body = { ...note(), mode: 'create' }
    await expect(put(event)).rejects.toMatchObject({ statusCode: 409 })
    mocks.body = { slug: 'x', title: 'X?', topics: ['crypto'], markdown: 'y' }
    await expect(put(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('deletes and pings for a published note', async () => {
    mocks.slugParam = 'live'
    await (await route('~~/server/api/til/admin/note/[slug].delete'))(event)
    expect(mocks.notes.some(n => n.slug === 'live')).toBe(false)
    expect(mocks.pings).toHaveLength(1)
  })
})

describe('mcp note tools', () => {
  async function callTool(name: string, args: Record<string, unknown> = {}) {
    mocks.body = { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }
    const res = await (await route('~~/server/routes/mcp'))(event)
    return res.result as { structuredContent?: any, isError?: boolean }
  }

  it('lists note tools next to the blog tools, with no delete', async () => {
    mocks.body = { jsonrpc: '2.0', id: 1, method: 'tools/list' }
    const res = await (await route('~~/server/routes/mcp'))(event)
    const names = res.result.tools.map((t: { name: string }) => t.name)
    expect(names).toEqual(expect.arrayContaining(['create_post', 'create_note', 'publish_note', 'list_topics']))
    expect(names.some((n: string) => n.includes('delete'))).toBe(false)
  })

  it('creates a draft, then publishing returns share texts', async () => {
    const created = await callTool('create_note', { title: 'How to pin a Nuxt route rule?', topics: ['web'], markdown: 'Use routeRules.\n\n```ts\nx\n```' })
    expect(created.isError).toBeUndefined()
    expect(created.structuredContent).toMatchObject({ slug: 'how-to-pin-a-nuxt-route-rule', published: false })
    expect(created.structuredContent.share).toBeUndefined()

    const published = await callTool('publish_note', { slug: 'how-to-pin-a-nuxt-route-rule' })
    expect(published.structuredContent.url).toBe('https://ravy.pro/til/how-to-pin-a-nuxt-route-rule')
    expect(published.structuredContent.share.linkedin).toContain('https://ravy.pro/til/how-to-pin-a-nuxt-route-rule')
    expect(published.structuredContent.share.x).toContain('#WebDev')
  })

  it('update_note never changes published, and bad topics are a fixable error', async () => {
    const res = await callTool('update_note', { slug: 'draft', title: 'Draft, renamed?', published: true } as never)
    expect(res.structuredContent.published).toBe(false)
    const ok = await callTool('update_note', { slug: 'draft', title: 'Draft, renamed?' })
    expect(ok.structuredContent.published).toBe(false)
    const bad = await callTool('create_note', { title: 'X?', topics: ['crypto'], markdown: 'y' })
    expect(bad.isError).toBe(true)
  })
})
