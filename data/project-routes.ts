import { ANIMATION_PAGE_PATHS, TINY_BOO_MOVIE } from './animation'
import { GAME_PAGE_PATHS, gamePath, GAMES, GAMES_PATH } from './games'
import { MUSIC_PAGE_PATHS, MUSIC_PATH, MUSIC_PROJECTS, musicPath } from './music'

export const PROJECTS_PATH = '/projects'

/**
 * Every creative-work page: the /projects hub, /games/**, /music/** and
 * /animation/**. nuxt.config.ts prerenders exactly this list and the sitemap
 * route lists it, so a new game or album needs no config edit.
 */
export const PROJECT_PAGE_PATHS: string[] = [
  PROJECTS_PATH,
  ...GAME_PAGE_PATHS,
  ...MUSIC_PAGE_PATHS,
  ...ANIMATION_PAGE_PATHS,
]

export interface SitemapImage { path: string, title: string }

/**
 * Sitemap rows for the creative-work pages, with the images each page shows
 * that are served from this site: the cover and screenshots of a game, the
 * hero and album covers of a music project. Hotlinked images from the
 * projects' own sites and from YouTube are left out of `<image:image>`.
 */
export function projectSitemapEntries(): Array<{ loc: string, images: SitemapImage[] }> {
  const own = (images: SitemapImage[]) => images.filter(i => i.path.startsWith('/'))
  return [
    { loc: PROJECTS_PATH, images: [] },
    { loc: GAMES_PATH, images: [] },
    ...GAMES.map(g => ({
      loc: gamePath(g),
      images: own([
        { path: g.cover.src, title: g.title },
        ...(g.screenshots ?? []).map(s => ({ path: s.src, title: `${g.title}: ${s.alt}` })),
      ]),
    })),
    { loc: MUSIC_PATH, images: [] },
    ...MUSIC_PROJECTS.map(p => ({
      loc: musicPath(p),
      images: own([
        { path: p.hero.src, title: p.name },
        ...p.releases.map(r => ({ path: r.cover, title: `${r.title} by ${p.name}` })),
      ]),
    })),
    { loc: TINY_BOO_MOVIE.path, images: own([{ path: TINY_BOO_MOVIE.hero.src, title: TINY_BOO_MOVIE.title }]) },
  ]
}

/**
 * Blog tag → the project page it belongs to. The category page for a tag shows
 * a link to it, so a reader of the devlog finds the store links and the player.
 */
export const TAG_PROJECT_LINKS: Record<string, { path: string, label: string }> = {
  'games': { path: GAMES_PATH, label: 'All my games' },
  'tiny-boo': { path: gamePath({ slug: 'tiny-boo-homecoming' }), label: 'Tiny Boo: Homecoming' },
  'idled': { path: gamePath({ slug: 'idled-survival' }), label: 'IDLED Survival' },
  'music': { path: MUSIC_PATH, label: 'Listen to my music' },
  'zynthar': { path: musicPath({ slug: 'zynthar' }), label: 'Listen to Zynthar' },
  'diva-rogue': { path: musicPath({ slug: 'diva-rogue' }), label: 'Listen to Diva Rogue' },
  'animation': { path: TINY_BOO_MOVIE.path, label: 'Watch Tiny Boo Movie' },
}
