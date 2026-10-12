import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import config from '~~/nuxt.config'
import { TINY_BOO_MOVIE } from '~/data/animation'
import { GAME_PAGE_PATHS, GAMES } from '~/data/games'
import { MUSIC_PAGE_PATHS, MUSIC_PROJECTS, SPOTIFY_ID_RX } from '~/data/music'
import { PROJECT_PAGE_PATHS, projectSitemapEntries, TAG_PROJECT_LINKS } from '~/data/project-routes'
import { PLATFORM_META, YOUTUBE_ID_RX } from '~/data/projects'
import { gameNode, musicGroupNode, seriesNode } from '~/utils/project-schema'

const REFS = { site: 'https://ravy.pro', personId: 'https://ravy.pro/#person', organizationId: 'https://ravy.pro/#org' }

describe('games registry', () => {
  it('has unique slugs', () => {
    const slugs = GAMES.map(g => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  // An "out now" card without a store link is a dead end for the visitor.
  it('gives every released game at least one store link', () => {
    for (const g of GAMES.filter(g => g.status === 'out-now'))
      expect(g.links.length, g.slug).toBeGreaterThan(0)
  })

  // A release date on an unreleased game would be advertised as datePublished.
  it('has no release date on an unreleased game', () => {
    for (const g of GAMES.filter(g => g.status !== 'out-now'))
      expect(g.releaseDate, g.slug).toBeUndefined()
  })

  it('uses valid YouTube ids for trailers', () => {
    for (const g of GAMES.filter(g => g.trailerYoutubeId))
      expect(g.trailerYoutubeId, g.slug).toMatch(YOUTUBE_ID_RX)
  })
})

describe('music registry', () => {
  it('has unique slugs', () => {
    const slugs = MUSIC_PROJECTS.map(p => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  // Decision: the music is presented openly as AI work. The disclosure is
  // required by the type, and this keeps it from being an empty string.
  it('discloses AI on every project', () => {
    for (const p of MUSIC_PROJECTS)
      expect(p.aiDisclosure.trim().length, p.slug).toBeGreaterThan(20)
  })

  it('uses valid Spotify ids', () => {
    for (const p of MUSIC_PROJECTS) {
      expect(p.spotifyArtistId, p.slug).toMatch(SPOTIFY_ID_RX)
      for (const r of p.releases.filter(r => r.spotifyAlbumId))
        expect(r.spotifyAlbumId, `${p.slug}/${r.title}`).toMatch(SPOTIFY_ID_RX)
    }
  })
})

describe('animation registry', () => {
  it('uses valid YouTube ids for episodes', () => {
    for (const ep of TINY_BOO_MOVIE.episodes)
      expect(ep.youtubeId, ep.code).toMatch(YOUTUBE_ID_RX)
  })
})

describe('project routes', () => {
  const nitro = config.nitro as { prerender?: { routes?: string[] } }
  const routes = nitro.prerender?.routes ?? []

  // Link crawling is off, so a page missing from this list is never prerendered.
  it('prerenders every project page', () => {
    for (const path of PROJECT_PAGE_PATHS)
      expect(routes, path).toContain(path)
  })

  it('includes every game and music page', () => {
    for (const path of [...GAME_PAGE_PATHS, ...MUSIC_PAGE_PATHS])
      expect(PROJECT_PAGE_PATHS).toContain(path)
  })

  it('lists every project page in the sitemap', () => {
    const locs = projectSitemapEntries().map(e => e.loc)
    for (const path of PROJECT_PAGE_PATHS)
      expect(locs, path).toContain(path)
  })

  it('only puts same-origin images in the sitemap', () => {
    for (const e of projectSitemapEntries().filter(e => e.image))
      expect(e.image!.path.startsWith('/'), e.loc).toBe(true)
  })

  it('points tag links at real project pages', () => {
    for (const [tag, link] of Object.entries(TAG_PROJECT_LINKS))
      expect(PROJECT_PAGE_PATHS, tag).toContain(link.path)
  })
})

describe('icons and CSP', () => {
  // Platform icons are bound dynamically, so the icon scanner can't see them.
  it('bundles every platform icon', () => {
    const icon = (config as { icon?: { clientBundle?: { icons?: string[] } } }).icon
    const bundled = icon?.clientBundle?.icons ?? []
    for (const { icon: name } of Object.values(PLATFORM_META))
      expect(bundled, name).toContain(name)
  })

  it('allows the embed hosts in frame-src', () => {
    const csp = readFileSync(new URL('../../server/plugins/csp.ts', import.meta.url), 'utf8')
    const frameSrc = csp.match(/frame-src[^`]*/)?.[0] ?? ''
    expect(frameSrc).toContain('https://open.spotify.com')
    expect(frameSrc).toContain('https://www.youtube-nocookie.com')
  })
})

describe('project schema', () => {
  // There is no rating source for games or music; seeded tool ratings must
  // never leak onto them.
  it('never emits ratings or reviews', () => {
    const nodes = [
      ...GAMES.map(g => gameNode(g, `${REFS.site}/games/${g.slug}`, REFS)),
      ...MUSIC_PROJECTS.map(p => musicGroupNode(p, `${REFS.site}/music/${p.slug}`, REFS)),
      seriesNode({ ...TINY_BOO_MOVIE, url: `${REFS.site}${TINY_BOO_MOVIE.path}`, name: TINY_BOO_MOVIE.title, image: TINY_BOO_MOVIE.hero.src }, REFS),
    ]
    const json = JSON.stringify(nodes)
    expect(json).not.toContain('aggregateRating')
    expect(json).not.toContain('"Review"')
  })

  it('does not offer an in-development game', () => {
    const g = GAMES.find(g => g.status === 'in-development')!
    expect(JSON.stringify(gameNode(g, 'x', REFS))).not.toContain('offers')
  })
})
