import type { Episode } from '~/data/animation'
import type { Game } from '~/data/games'
import type { MusicProject } from '~/data/music'

// schema.org nodes for the creative-work pages. Pure functions of the registry
// entry, so they are unit-tested without a Nuxt context
// (tests/unit/project-schema.test.ts); composables/useStructuredData.ts wraps
// them with the shared identity graph and the page head.
//
// No node here carries `aggregateRating` or `review`. The only rating data on
// this site is the seeded tool counters, and a game or an album with invented
// stars is exactly what Google's structured-data policy penalises.

export interface SchemaRefs {
  site: string
  personId: string
  organizationId: string
}

function abs(site: string, path: string): string {
  return /^https?:\/\//.test(path) ? path : `${site}${path.startsWith('/') ? path : `/${path}`}`
}

function youtubeVideoNode(id: string, name: string, description: string, uploadDate?: string) {
  return {
    '@type': 'VideoObject',
    name,
    description,
    'thumbnailUrl': `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    'embedUrl': `https://www.youtube-nocookie.com/embed/${id}`,
    'contentUrl': `https://www.youtube.com/watch?v=${id}`,
    ...(uploadDate ? { uploadDate } : {}),
  }
}

export function gameNode(game: Game, url: string, refs: SchemaRefs) {
  const mobile = game.platforms.some(p => p === 'iOS' || p === 'Android')
  return {
    '@type': mobile ? ['VideoGame', 'MobileApplication'] : 'VideoGame',
    '@id': `${url}#game`,
    'name': game.title,
    url,
    'description': game.description,
    'genre': game.genre,
    'image': abs(refs.site, game.cover.src),
    ...(game.screenshots?.length
      ? { screenshot: game.screenshots.map(s => abs(refs.site, s.src)) }
      : {}),
    'gamePlatform': game.platforms,
    ...(mobile ? { operatingSystem: game.platforms.join(', '), applicationCategory: 'GameApplication' } : {}),
    'author': { '@id': refs.personId },
    'publisher': { '@id': refs.organizationId },
    ...(game.releaseDate ? { datePublished: game.releaseDate } : {}),
    // Free to play or free to wishlist: every game listed is free to start.
    // An in-development game with no store page has nothing to offer yet.
    ...(game.status !== 'in-development' && game.links.length
      ? {
          offers: {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
            'availability': game.status === 'coming-soon'
              ? 'https://schema.org/PreOrder'
              : 'https://schema.org/InStock',
            'url': game.links[0]!.url,
          },
        }
      : {}),
    ...(game.trailerYoutubeId
      ? { trailer: youtubeVideoNode(game.trailerYoutubeId, `${game.title} trailer`, game.tagline) }
      : {}),
    'sameAs': game.links.filter(l => l.kind !== 'telegram').map(l => l.url),
  }
}

export function musicGroupNode(project: MusicProject, url: string, refs: SchemaRefs) {
  return {
    '@type': 'MusicGroup',
    '@id': `${url}#artist`,
    'name': project.name,
    url,
    'description': `${project.tagline} ${project.aiDisclosure}`,
    'genre': project.genres,
    'image': abs(refs.site, project.hero.src),
    'founder': { '@id': refs.personId },
    'sameAs': [project.website, ...project.platforms.map(p => p.url)],
    ...(project.characters?.length
      ? {
          member: project.characters.map(c => ({
            '@type': 'OrganizationRole',
            'roleName': c.role,
            'member': { '@type': 'Person', 'name': `${c.name} (fictional character)` },
          })),
        }
      : {}),
    'album': project.releases.map(r => ({
      '@type': 'MusicAlbum',
      'name': r.title,
      'datePublished': r.date,
      'image': abs(refs.site, r.cover),
      'byArtist': { '@id': `${url}#artist` },
      ...(r.trackCount ? { numTracks: r.trackCount } : {}),
      ...(r.links.length ? { sameAs: r.links.map(l => l.url) } : {}),
    })),
  }
}

export function seriesNode(opts: {
  url: string
  name: string
  description: string
  image: string
  channelUrl: string
  episodes: Episode[]
}, refs: SchemaRefs) {
  return {
    '@type': 'CreativeWorkSeries',
    '@id': `${opts.url}#series`,
    'name': opts.name,
    'url': opts.url,
    'description': opts.description,
    'image': abs(refs.site, opts.image),
    'creator': { '@id': refs.personId },
    'publisher': { '@id': refs.organizationId },
    'sameAs': [opts.channelUrl],
    'hasPart': opts.episodes.map(e => ({
      ...youtubeVideoNode(e.youtubeId, `${opts.name}: ${e.title}`, e.logline),
      isPartOf: { '@id': `${opts.url}#series` },
    })),
  }
}
