// Shared vocabulary for the creative-work registries: games (data/games.ts),
// music (data/music.ts) and animation (data/animation.ts), and the /projects hub
// that lists all three.
//
// These are deliberately separate from the three commercial registries
// (`publicServices`, `GATED_TOOLS`, `OFFERINGS`): nothing here is a tool or a
// service, and putting a game in `publicServices` would give it a seeded
// rating badge — see the note on ratings in CLAUDE.md.

/** Where an outbound link points. Drives the icon and the default label. */
export type PlatformKind
  = | 'app-store'
    | 'google-play'
    | 'steam'
    | 'telegram'
    | 'website'
    | 'spotify'
    | 'apple-music'
    | 'youtube-music'
    | 'tidal'
    | 'deezer'
    | 'amazon-music'
    | 'boomplay'
    | 'youtube'
    | 'instagram'
    | 'facebook'

export interface ExternalLink {
  kind: PlatformKind
  url: string
  /** Overrides the default label from `PLATFORM_META` ("Wishlist on Steam"). */
  label?: string
}

/**
 * Icon and label per platform.
 *
 * The icons are bound dynamically, so every one of them MUST also be listed in
 * `icon.clientBundle.icons` in nuxt.config.ts — the scanner can't see them, and a
 * missing one renders as an empty box on the client.
 * `tests/unit/projects.test.ts` checks that.
 */
export const PLATFORM_META: Record<PlatformKind, { label: string, icon: string }> = {
  'app-store': { label: 'App Store', icon: 'simple-icons:appstore' },
  'google-play': { label: 'Google Play', icon: 'simple-icons:googleplay' },
  'steam': { label: 'Steam', icon: 'simple-icons:steam' },
  'telegram': { label: 'Telegram', icon: 'simple-icons:telegram' },
  'website': { label: 'Website', icon: 'mdi:web' },
  'spotify': { label: 'Spotify', icon: 'simple-icons:spotify' },
  'apple-music': { label: 'Apple Music', icon: 'simple-icons:applemusic' },
  'youtube-music': { label: 'YouTube Music', icon: 'simple-icons:youtubemusic' },
  'tidal': { label: 'Tidal', icon: 'simple-icons:tidal' },
  'deezer': { label: 'Deezer', icon: 'simple-icons:deezer' },
  'amazon-music': { label: 'Amazon Music', icon: 'simple-icons:amazonmusic' },
  'boomplay': { label: 'Boomplay', icon: 'mdi:music-circle-outline' },
  'youtube': { label: 'YouTube', icon: 'simple-icons:youtube' },
  'instagram': { label: 'Instagram', icon: 'simple-icons:instagram' },
  'facebook': { label: 'Facebook', icon: 'simple-icons:facebook' },
}

export function platformLabel(link: ExternalLink): string {
  return link.label || PLATFORM_META[link.kind].label
}

/** Release state of a game. Music releases are dated instead. */
export type ProjectStatus = 'out-now' | 'coming-soon' | 'in-development'

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  'out-now': 'Out now',
  'coming-soon': 'Coming soon',
  'in-development': 'In development',
}

/** Thumbnail YouTube serves for every public video. `hqdefault` always exists. */
export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

/** "October 2026" from `YYYY-MM` or `YYYY-MM-DD`. */
export function releaseMonth(date: string): string {
  const [y, m] = date.split('-').map(Number)
  if (!y || !m)
    return date
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Matches an 11-character YouTube video id. */
export const YOUTUBE_ID_RX = /^[\w-]{11}$/

/** Copy for the three hub pages. */
export const HUB_COPY = {
  projects: {
    title: 'Projects: games, music and animation',
    heading: 'Projects',
    description: 'Games, music and an animated series by Andrei Rovnyi: what each one is, where to play, listen or watch it, and what I built for it.',
  },
  games: {
    title: 'Games: mobile, Steam and Telegram',
    heading: 'Games',
    description: 'Games I have made at my studio XPLOIT: a cozy mobile adventure, a space puzzle, an idle RPG on Telegram, a card-collecting sim and a co-op gladiator game. Store links, trailers, and what I built in each one.',
  },
  music: {
    title: 'Music: Zynthar and Diva Rogue',
    heading: 'Music',
    description: 'Two AI music projects I write and produce: Zynthar, an imagined post-hardcore band with real emotions, and Diva Rogue, an AI R&B and hip-hop artist. Listen here or on every major platform.',
  },
} as const
