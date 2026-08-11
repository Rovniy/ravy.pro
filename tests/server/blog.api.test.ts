import type { BlogPostRecord } from '~~/utils/blog-post'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The store is mocked rather than Firestore itself: these tests are about the
// route contract (what is public, what 404s, what an unauthorised caller gets),
// not about document shapes, which blog-post.util.test.ts already covers.

const mocks = vi.hoisted(() => ({
  posts: [] as BlogPostRecord[],
  slugParam: '',
  toolAccessError: null as Error | null,
  legacyMap: {} as Record<string, string>,
}))

const setHeaderMock = vi.fn()

const sendRedirectMock = vi.fn()

// tests/setup.ts unstubs every global after each test, so these have to be
// re-stubbed per test rather than once at module scope.
function stubNitroGlobals() {
  vi.stubGlobal('setHeader', setHeaderMock)
  vi.stubGlobal('sendRedirect', sendRedirectMock)
  vi.stubGlobal('getRouterParam', () => mocks.slugParam)
  vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => {
    const err = new Error(opts.statusMessage) as Error & { statusCode: number }
    err.statusCode = opts.statusCode
    return err
  })
}

vi.mock('~~/server/utils/blog-store', () => ({
  listMeta: vi.fn(async (opts: { publishedOnly?: boolean } = {}) => mocks.posts
    .filter(p => !opts.publishedOnly || p.published)
    .map(({ markdown: _markdown, ...meta }) => meta)),
  getPost: vi.fn(async (slug: string) => mocks.posts.find(p => p.slug === slug) ?? null),
  rebuildIndex: vi.fn(async () => []),
}))

vi.mock('~~/server/utils/legacy-media', () => ({
  getLegacyMediaMap: vi.fn(async () => mocks.legacyMap),
}))

vi.mock('~~/server/utils/access', () => ({
  requireToolAccess: vi.fn(async () => {
    if (mocks.toolAccessError)
      throw mocks.toolAccessError
    return { uid: 'u1', email: 'admin@example.com' }
  }),
}))

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

beforeEach(() => {
  mocks.posts = [post(), post({ slug: 'draft', path: '/blogs/draft', title: 'Draft', published: false })]
  mocks.slugParam = ''
  mocks.toolAccessError = null
  mocks.legacyMap = { '/blog-cover/old.webp': '/media/blog/live/old-abc1234567.webp' }
  setHeaderMock.mockClear()
  sendRedirectMock.mockClear()
  stubNitroGlobals()
})

describe('gET /api/blog/posts', () => {
  it('returns published posts without their bodies', async () => {
    const { default: handler } = await import('~~/server/api/blog/posts.get')
    const result = await handler({} as never)
    expect(result.map((p: { slug: string }) => p.slug)).toEqual(['live'])
    expect('markdown' in result[0]).toBe(false)
  })

  it('sets a short CDN cache so a new post appears without a deploy', async () => {
    const { default: handler } = await import('~~/server/api/blog/posts.get')
    await handler({} as never)
    const header = setHeaderMock.mock.calls.find(c => c[1] === 'cache-control')?.[2]
    expect(header).toContain('s-maxage=60')
  })
})

describe('gET /api/blog/post/[slug]', () => {
  it('renders the body of a published post', async () => {
    mocks.slugParam = 'live'
    const { default: handler } = await import('~~/server/api/blog/post/[slug].get')
    const result = await handler({} as never)
    expect(result.title).toBe('Live')
    // The raw markdown must not travel to the client — it would double the payload.
    expect('markdown' in result).toBe(false)
    expect(result.body).toBeTruthy()
    // The toc has to sit on `body`, because components/blog/toc.vue reads
    // `articles.body.toc.links` while parseMarkdown returns it as a sibling.
    expect(result.body.toc).toBeTruthy()
  }, 20_000)

  it('404s a draft rather than exposing it', async () => {
    mocks.slugParam = 'draft'
    const { default: handler } = await import('~~/server/api/blog/post/[slug].get')
    await expect(handler({} as never)).rejects.toThrow('Post not found')
  })

  it('404s an unknown or malformed slug', async () => {
    const { default: handler } = await import('~~/server/api/blog/post/[slug].get')
    mocks.slugParam = 'nope'
    await expect(handler({} as never)).rejects.toThrow('Post not found')
    mocks.slugParam = 'Not A Slug'
    await expect(handler({} as never)).rejects.toThrow('Post not found')
  })
})

describe('admin routes', () => {
  it('list includes drafts', async () => {
    const { default: handler } = await import('~~/server/api/blog/admin/posts.get')
    const result = await handler({} as never)
    expect(result.map((p: { slug: string }) => p.slug).sort()).toEqual(['draft', 'live'])
  })

  it('refuses a caller without the studio grant', async () => {
    mocks.toolAccessError = new Error('You do not have access to this tool')
    const { default: handler } = await import('~~/server/api/blog/admin/posts.get')
    await expect(handler({} as never)).rejects.toThrow(/do not have access/)
  })
})

/*
 * The pre-Storage image URLs are indexed by Google Images, listed as
 * <image:loc> in the sitemap, and one of them is linked from /links. Deleting
 * public/blog-* without these redirects would 404 all of that.
 */
describe('legacy asset redirects', () => {
  it('301s a mapped path to its Storage location', async () => {
    mocks.slugParam = 'old.webp'
    const { default: handler } = await import('~~/server/routes/blog-cover/[...path].get')
    await handler({} as never)
    expect(sendRedirectMock).toHaveBeenCalledWith({}, '/media/blog/live/old-abc1234567.webp', 301)
  })

  it('404s an unmapped path instead of redirecting somewhere wrong', async () => {
    mocks.slugParam = 'never-existed.webp'
    const { default: handler } = await import('~~/server/routes/blog-cover/[...path].get')
    await expect(handler({} as never)).rejects.toThrow('Not found')
    expect(sendRedirectMock).not.toHaveBeenCalled()
  })

  it('refuses traversal', async () => {
    mocks.slugParam = '../../etc/passwd'
    const { default: handler } = await import('~~/server/routes/blog-content/[...path].get')
    await expect(handler({} as never)).rejects.toThrow('Not found')
  })

  // A year-long immutable 301 would be permanent in every browser cache.
  it('caches the redirect for a day, not forever', async () => {
    mocks.slugParam = 'old.webp'
    const { default: handler } = await import('~~/server/routes/blog-cover/[...path].get')
    await handler({} as never)
    const header = setHeaderMock.mock.calls.find(c => c[1] === 'cache-control')?.[2]
    expect(header).toContain('s-maxage=86400')
    expect(header).not.toContain('immutable')
  })
})
