import type { BlogPostRecord } from '~~/utils/blog-post'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The MCP route and the blog tools behind it. The store is mocked like in
// blog.api.test.ts: these tests pin the contract — who gets in, what a tool
// may change — not Firestore document shapes.

const mocks = vi.hoisted(() => ({
  posts: [] as BlogPostRecord[],
  saved: [] as BlogPostRecord[],
  token: null as null | { clientId: string, email: string, uid: string, resource: string },
  hasAccess: true,
  headers: {} as Record<string, string>,
  body: undefined as unknown,
  status: 200,
  responseHeaders: {} as Record<string, string>,
}))

vi.mock('~~/server/utils/blog-store', () => ({
  listMeta: vi.fn(async () => mocks.posts.map(({ markdown: _m, ...meta }) => meta)),
  getPost: vi.fn(async (slug: string) => mocks.posts.find(p => p.slug === slug) ?? null),
  savePost: vi.fn(async (record: BlogPostRecord) => {
    mocks.saved.push(record)
    mocks.posts = [...mocks.posts.filter(p => p.slug !== record.slug), record]
  }),
}))
vi.mock('~~/server/utils/blog-render', () => ({ clearRenderCache: vi.fn() }))
vi.mock('~~/server/utils/blog-media', () => ({ putMedia: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/rate-limit', () => ({ assertRateLimit: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/report-error', () => ({ reportServerEvent: vi.fn() }))
vi.mock('~~/server/utils/access', () => ({ hasToolAccess: vi.fn(async () => mocks.hasAccess) }))
vi.mock('~~/server/utils/mcp/http', () => ({ applyMcpCors: () => false }))
vi.mock('~~/server/utils/mcp/oauth-store', () => ({
  siteOrigin: () => 'https://ravy.pro',
  resolveAccessToken: vi.fn(async (t: string) => (t === 'good' ? mocks.token : null)),
}))

function stubNitroGlobals() {
  vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => mocks.headers[name.toLowerCase()])
  vi.stubGlobal('readBody', async () => mocks.body)
  vi.stubGlobal('setResponseStatus', (_e: unknown, code: number) => {
    mocks.status = code
  })
  vi.stubGlobal('setHeader', (_e: unknown, name: string, value: string) => {
    mocks.responseHeaders[name] = value
  })
}

function post(overrides: Partial<BlogPostRecord> = {}): BlogPostRecord {
  return {
    path: '/blogs/live',
    slug: 'live',
    title: 'Live',
    description: 'A published post',
    image: '/media/blog/live/cover.webp',
    ogImage: '/media/blog/live/cover.webp',
    alt: 'A published post',
    tags: ['dev'],
    published: true,
    trending: false,
    noindex: false,
    theme: '',
    locale: 'en_US',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastUpdated: '2026-01-02T00:00:00.000Z',
    markdown: '## Hello\n\nBody text.',
    ...overrides,
  }
}

const event = { method: 'POST' } as never

async function rpc(method: string, params?: Record<string, unknown>) {
  mocks.body = { jsonrpc: '2.0', id: 1, method, params }
  const { default: handler } = await import('~~/server/routes/mcp')
  return handler(event) as Promise<{ result?: any, error?: any }>
}

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const res = await rpc('tools/call', { name, arguments: args })
  return res.result as { content: { text: string }[], structuredContent?: any, isError?: boolean }
}

beforeEach(() => {
  mocks.posts = [post(), post({ slug: 'draft', path: '/blogs/draft', title: 'Draft', published: false, createdAt: '2026-02-01T00:00:00.000Z' })]
  mocks.saved = []
  mocks.token = { clientId: 'mcp_c', email: 'admin@example.com', uid: 'u1', resource: 'https://ravy.pro/mcp' }
  mocks.hasAccess = true
  mocks.headers = { authorization: 'Bearer good' }
  mocks.status = 200
  mocks.responseHeaders = {}
  stubNitroGlobals()
})

describe('mcp auth', () => {
  it('401s without a token and points at the resource metadata', async () => {
    mocks.headers = {}
    await rpc('tools/list')
    expect(mocks.status).toBe(401)
    expect(mocks.responseHeaders['WWW-Authenticate']).toContain('resource_metadata="https://ravy.pro/.well-known/oauth-protected-resource/mcp"')
  })

  it('401s an unknown token', async () => {
    mocks.headers = { authorization: 'Bearer bad' }
    await rpc('tools/list')
    expect(mocks.status).toBe(401)
  })

  it('401s a token minted for another resource', async () => {
    mocks.token = { ...mocks.token!, resource: 'https://elsewhere.example/mcp' }
    await rpc('tools/list')
    expect(mocks.status).toBe(401)
  })

  // Removing the studio grant must cut off already-connected clients.
  it('403s when the owner lost studio access', async () => {
    mocks.hasAccess = false
    await rpc('tools/list')
    expect(mocks.status).toBe(403)
  })

  it('answers notifications with 202', async () => {
    mocks.body = { jsonrpc: '2.0', method: 'notifications/initialized' }
    const { default: handler } = await import('~~/server/routes/mcp')
    expect(await handler(event)).toBeNull()
    expect(mocks.status).toBe(202)
  })
})

describe('blog tools', () => {
  it('exposes no delete tool', async () => {
    const res = await rpc('tools/list')
    const names = res.result.tools.map((t: { name: string }) => t.name)
    expect(names).toContain('create_post')
    expect(names).toContain('publish_post')
    expect(names.some((n: string) => n.includes('delete'))).toBe(false)
  })

  it('creates a draft by default, deriving the slug from the title', async () => {
    const result = await callTool('create_post', {
      title: 'Hello MCP World',
      description: 'desc',
      markdown: '## Hi\n\nText',
      tags: ['ai'],
      image: '/media/blog/hello-mcp-world/a.webp',
    })
    expect(result.isError).toBeUndefined()
    expect(mocks.saved[0]).toMatchObject({ slug: 'hello-mcp-world', path: '/blogs/hello-mcp-world', published: false })
    expect(result.structuredContent.url).toBe('https://ravy.pro/blogs/hello-mcp-world')
  })

  it('refuses to overwrite an existing slug', async () => {
    const result = await callTool('create_post', { slug: 'live', title: 'X', description: 'd', markdown: 'b', tags: ['ai'], image: '/x.webp' })
    expect(result.isError).toBe(true)
    expect(mocks.saved).toHaveLength(0)
  })

  it('refuses tags the site does not know', async () => {
    const result = await callTool('create_post', { title: 'X', description: 'd', markdown: 'b', tags: ['crypto'], image: '/x.webp' })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('crypto')
  })

  it('surfaces save-time validation to the model', async () => {
    const result = await callTool('create_post', {
      title: 'Embed',
      description: 'd',
      markdown: '<iframe src="https://youtube.com/embed/x" width="720"></iframe>',
      tags: ['ai'],
      image: '/x.webp',
    })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toMatch(/width\/height/)
  })

  it('update_post changes only what is passed and never publishes', async () => {
    await callTool('update_post', { slug: 'draft', title: 'Renamed', published: true })
    expect(mocks.saved[0]).toMatchObject({ slug: 'draft', title: 'Renamed', published: false, markdown: '## Hello\n\nBody text.', path: '/blogs/draft' })
  })

  it('publish_post publishes, keeping the date unless asked to redate', async () => {
    await callTool('publish_post', { slug: 'draft' })
    expect(mocks.saved[0]).toMatchObject({ published: true, createdAt: '2026-02-01T00:00:00.000Z' })

    await callTool('publish_post', { slug: 'draft', redate: true })
    expect(mocks.saved[1]?.createdAt).not.toBe('2026-02-01T00:00:00.000Z')
  })

  it('unpublish_post takes a post down', async () => {
    await callTool('unpublish_post', { slug: 'live' })
    expect(mocks.saved[0]?.published).toBe(false)
  })

  it('get_post returns the markdown; list_posts filters drafts', async () => {
    const got = await callTool('get_post', { slug: 'draft' })
    expect(got.structuredContent.markdown).toContain('Body text')

    const drafts = await callTool('list_posts', { status: 'draft' })
    expect(drafts.structuredContent.posts.map((p: { slug: string }) => p.slug)).toEqual(['draft'])
  })

  it('reports a missing post as a fixable error', async () => {
    const result = await callTool('get_post', { slug: 'missing' })
    expect(result.isError).toBe(true)
  })

  it('upload_image rejects a non-image before storing anything', async () => {
    const { putMedia } = await import('~~/server/utils/blog-media')
    const result = await callTool('upload_image', { slug: 'live', data_base64: Buffer.from('<svg></svg>').toString('base64') })
    expect(result.isError).toBe(true)
    expect(putMedia).not.toHaveBeenCalled()
  })
})
