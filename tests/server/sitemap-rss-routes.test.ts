import { describe, expect, it, vi } from 'vitest'

describe('sitemap and rss routes', () => {
  it('sitemap includes tools and categories', async () => {
    vi.stubGlobal('queryCollection', () => ({
      where: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      all: vi.fn(async () => ([
        {
          path: '/blogs/a',
          title: 'A',
          description: 'D',
          tags: ['nuxt'],
          createdAt: '2026-01-01',
        },
      ])),
    }))
    const { default: handler } = await import('~~/server/api/__sitemap__/urls')
    const urls = await handler({} as never)
    const locs = urls.map((x: { loc: string }) => x.loc)
    expect(locs).toContain('/tools/qr-code-generator')
    expect(locs).toContain('/tools/steam-ai-disclosure')
    // Gated tools must not be advertised in the sitemap.
    expect(locs).not.toContain('/tools/contract-red-flag-scanner')
    expect(locs).toContain('/categories/nuxt')
  })

  it('rss route returns xml', async () => {
    const setHeaderMock = vi.fn()
    vi.stubGlobal('setHeader', setHeaderMock)
    vi.stubGlobal('queryCollection', () => ({
      where: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      all: vi.fn(async () => ([
        {
          path: '/blogs/a',
          title: 'A',
          description: 'Desc',
          createdAt: '2026-01-01',
        },
      ])),
    }))
    const { default: handler } = await import('~~/server/routes/rss.xml')
    const xml = await handler({} as never)
    expect(setHeaderMock).toHaveBeenCalled()
    expect(xml).toContain('<rss')
  })
})
