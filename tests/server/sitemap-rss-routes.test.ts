import type { BlogPostRecord } from '~~/utils/blog-post'
import { describe, expect, it, vi } from 'vitest'

// `/docs` still comes from @nuxt/content, and the routes import
// `queryCollection` explicitly from '@nuxt/content/server' (the auto-import's
// type context resolves to the 1-arg app composable), so the module is mocked
// here — importing the real one pulls in the Nitro-only '#content/manifest'
// alias, which doesn't exist in the vitest environment.
//
// Blog posts come from Firestore instead, so the store is mocked too.
const mocks = vi.hoisted(() => ({
  docRows: [] as Record<string, unknown>[],
  posts: [] as BlogPostRecord[],
}))

vi.mock('@nuxt/content/server', () => ({
  queryCollection: () => ({
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    all: vi.fn(async () => mocks.docRows),
  }),
}))

vi.mock('~~/server/utils/blog-store', () => ({
  listMeta: vi.fn(async () => mocks.posts.map(({ markdown: _markdown, ...meta }) => meta)),
  getPost: vi.fn(async (slug: string) => mocks.posts.find(p => p.slug === slug) ?? null),
}))

function post(overrides: Partial<BlogPostRecord> = {}): BlogPostRecord {
  return {
    path: '/blogs/a',
    slug: 'a',
    title: 'A',
    description: 'Desc',
    image: '/blog-cover/a.webp',
    ogImage: '/blog-opengraph/a.png',
    alt: 'Desc',
    tags: ['nuxt'],
    published: true,
    trending: false,
    noindex: false,
    theme: '',
    locale: 'en_US',
    createdAt: '2026-01-01',
    lastUpdated: '2026-01-01',
    markdown: '## Heading\n\nSome **body** text with a [link](/tools).',
    ...overrides,
  }
}

describe('sitemap and rss routes', () => {
  it('sitemap includes tools and categories', async () => {
    mocks.docRows = []
    mocks.posts = [post()]
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    expect(locs).toContain('/tools/qr-code-generator')
    expect(locs).toContain('/tools/steam-ai-disclosure')
    // Contract Red-Flag Scanner is now a public, paid tool — it must be indexed.
    expect(locs).toContain('/tools/contract-red-flag-scanner')
    expect(locs).toContain('/categories/nuxt')
  })

  it('sitemap lists the pages that stopped being prerendered', async () => {
    mocks.docRows = []
    mocks.posts = []
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    // These used to reach the sitemap through prerender auto-discovery. They
    // render per request now, so the custom source has to name them.
    expect(locs).toContain('/')
    expect(locs).toContain('/blogs')
    expect(locs).toContain('/categories')
  })

  it('sitemap includes the services index and every offering with its own page', async () => {
    mocks.docRows = []
    mocks.posts = []
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    expect(locs).toContain('/services')
    expect(locs).toContain('/services/mentorship')
  })

  it('rss route renders each post body to html', async () => {
    const setHeaderMock = vi.fn()
    vi.stubGlobal('setHeader', setHeaderMock)
    mocks.posts = [post()]
    const { default: handler } = await import('~~/server/routes/rss.xml')
    const xml = await handler({} as never)
    expect(setHeaderMock).toHaveBeenCalled()
    expect(xml).toContain('<rss')
    // The body is markdown in Firestore and has to arrive as HTML in the feed,
    // with root-relative links absolutized against the site URL.
    expect(xml).toContain('<h2>Heading</h2>')
    expect(xml).toContain('<strong>body</strong>')
    expect(xml).toContain('<a href="https://ravy.pro/tools">link</a>')
  }, 20_000)
})
