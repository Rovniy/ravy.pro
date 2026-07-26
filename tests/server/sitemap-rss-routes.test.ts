import { describe, expect, it, vi } from 'vitest'

// The routes import `queryCollection` explicitly from '@nuxt/content/server'
// (the auto-import's type context resolves to the 1-arg app composable), so
// the module is mocked here — importing the real one pulls in the Nitro-only
// '#content/manifest' alias, which doesn't exist in the vitest environment.
const mocks = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
}))

vi.mock('@nuxt/content/server', () => ({
  queryCollection: () => ({
    where: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    all: vi.fn(async () => mocks.rows),
  }),
}))

describe('sitemap and rss routes', () => {
  it('sitemap includes tools and categories', async () => {
    mocks.rows = [
      {
        path: '/blogs/a',
        title: 'A',
        description: 'D',
        tags: ['nuxt'],
        createdAt: '2026-01-01',
      },
    ]
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    expect(locs).toContain('/tools/qr-code-generator')
    expect(locs).toContain('/tools/steam-ai-disclosure')
    // Contract Red-Flag Scanner is now a public, paid tool — it must be indexed.
    expect(locs).toContain('/tools/contract-red-flag-scanner')
    expect(locs).toContain('/categories/nuxt')
  })

  it('sitemap includes the services index and every offering with its own page', async () => {
    mocks.rows = []
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    expect(locs).toContain('/services')
    expect(locs).toContain('/services/mentorship')
  })

  it('rss route returns xml', async () => {
    const setHeaderMock = vi.fn()
    vi.stubGlobal('setHeader', setHeaderMock)
    mocks.rows = [
      {
        path: '/blogs/a',
        title: 'A',
        description: 'Desc',
        createdAt: '2026-01-01',
      },
    ]
    const { default: handler } = await import('~~/server/routes/rss.xml')
    const xml = await handler({} as never)
    expect(setHeaderMock).toHaveBeenCalled()
    expect(xml).toContain('<rss')
  })
})
