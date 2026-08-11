import { describe, expect, it } from 'vitest'
import { baseData } from '~~/data'
import config from '~~/nuxt.config'
import { MEDIA_URL_PREFIX } from '~~/utils/blog-media'

/*
 * Post images are served by the `/media/blog/**` Nitro route, not from
 * `public/`. IPX resolves a root-relative id against the filesystem, so without
 * an alias sending those ids to its HTTP storage every optimized post image
 * 404s — silently, in production, on every card on the home page. That shipped
 * once; these assertions are what stop it shipping twice.
 */
describe('ipx can reach the media route', () => {
  const image = config.image as {
    domains?: string[]
    alias?: Record<string, string>
  }

  it('aliases the media prefix to an absolute URL', () => {
    const alias = image.alias ?? {}
    const entry = Object.entries(alias).find(([base]) => MEDIA_URL_PREFIX.startsWith(base))
    expect(entry, `no image.alias entry covers ${MEDIA_URL_PREFIX}`).toBeTruthy()
    // Absolute is the whole point: IPX picks HTTP storage over filesystem
    // storage by whether the resolved id has a protocol.
    expect(entry![1]).toMatch(/^https?:\/\//)
  })

  it('resolves to the same origin that serves the route', () => {
    const alias = image.alias ?? {}
    const target = Object.entries(alias).find(([base]) => MEDIA_URL_PREFIX.startsWith(base))![1]
    expect(target).toBe(`${baseData.site.url}${MEDIA_URL_PREFIX}`)
  })

  // `domains` is what creates the HTTP storage in the first place, and it
  // allow-lists the host — an alias without it still 404s.
  it('allow-lists that origin in image.domains', () => {
    expect(image.domains).toContain(new URL(baseData.site.url).host)
  })
})
