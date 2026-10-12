import type { ExternalLink } from './projects'

// The music projects shown under /music.
//
// Both are AI music projects, and the site says so plainly (decided 2026-10-12).
// `aiDisclosure` is required and rendered on the page, so neither project can
// read as a human artist with a real tour history. Diva Rogue's backstory on
// divarogue.com is the character's lore; no stream counts or live-show claims
// from that site belong here.
//
// Album covers live in the repo under public/music/covers/<artist>/, 600px
// WebP made from the masters in Drive ("XPLOIT Music"). Releases whose master
// isn't there yet still use a same-origin copy under /media/blog/music-covers/
// (STORED_COVER) until the file is added. `spotifyAlbumId` turns on the embedded player for
// that release; a release without one links out to the stores instead.
// Release dates and track counts follow the store listings.

export interface Release {
  title: string
  /** `YYYY-MM-DD` or `YYYY-MM`. */
  date: string
  trackCount?: number
  /** Square cover art. */
  cover: string
  /** One line on what the record is about. */
  theme?: string
  spotifyAlbumId?: string
  links: ExternalLink[]
}

export interface MusicProject {
  slug: string
  name: string
  /** One line under the name and on the hub card. */
  tagline: string
  motto: string
  genres: string[]
  /** Required: how AI is involved, in one plain sentence. */
  aiDisclosure: string
  /** Paragraphs for the "What it is" section. */
  concept: string[]
  characters?: { name: string, role: string }[]
  /** 16:9 image for the hub card and the page hero. */
  hero: { src: string, alt: string }
  /** Spotify artist id — the artist player shows when no release has an album id. */
  spotifyArtistId: string
  /** Newest first. */
  releases: Release[]
  platforms: ExternalLink[]
  website: string
  blogTag: string
}

const COVER = (artist: string, slug: string) => `/music/covers/${artist}/${slug}.webp`
const STORED_COVER = (id: string) => `/media/blog/music-covers/${id}.webp`
const SPOTIFY_ALBUM = (id: string): ExternalLink => ({ kind: 'spotify', url: `https://open.spotify.com/album/${id}` })
const APPLE_ALBUM = (id: string): ExternalLink => ({ kind: 'apple-music', url: `https://music.apple.com/us/album/${id}` })

export const MUSIC_PROJECTS: MusicProject[] = [
  {
    slug: 'zynthar',
    name: 'Zynthar',
    tagline: 'An imagined post-hardcore band. Real emotions.',
    motto: 'Break the silence, embrace the rift.',
    genres: ['Post-hardcore', 'Metalcore', 'Rap-rock'],
    aiDisclosure: 'Zynthar is my personal AI music project: I write the story and shape every release from the first idea to the final sound, with modern production tools including AI.',
    concept: [
      'Every Zynthar song starts with something I have lived through: a loss, a doubt, a fight with myself, a new beginning. The albums follow that path, chapter by chapter.',
      'Kai Vega, Dax Cole and Ivy Hart are the characters I gave these feelings to. The band is imagined. What you hear in it is not.',
      'The sound is post-hardcore, metalcore and rap-rock: long atmospheric intros that break into screams, melodic choruses and rap verses.',
    ],
    characters: [
      { name: 'Kai Vega', role: 'Vocals and screams' },
      { name: 'Dax Cole', role: 'Drums' },
      { name: 'Ivy Hart', role: 'Guitar' },
    ],
    hero: {
      src: '/media/blog/how-i-started-making-music-with-ai/zynthar-fad454e754.webp',
      alt: 'Zynthar album cover art',
    },
    spotifyArtistId: '3z0vh8xXLIMiRxVUthV08h',
    releases: [
      {
        title: 'Bedtime Stories',
        date: '2026-10-03',
        trackCount: 6,
        cover: COVER('zynthar', 'bedtime-stories'),
        theme: 'The newest chapter of the story.',
        spotifyAlbumId: '088xzi1ncR3PGvllrDDFDi',
        links: [{ kind: 'spotify', url: 'https://open.spotify.com/album/088xzi1ncR3PGvllrDDFDi' }, APPLE_ALBUM('6819039287')],
      },
      {
        title: 'A New Page of Life',
        date: '2025-05-15',
        trackCount: 10,
        cover: COVER('zynthar', 'a-new-page-of-life'),
        theme: 'From loss and uncertainty to rebirth, hope and inner strength.',
        spotifyAlbumId: '0u9dt1vcveLDIdDtzhAb6h',
        links: [{ kind: 'spotify', url: 'https://open.spotify.com/album/0u9dt1vcveLDIdDtzhAb6h' }, APPLE_ALBUM('1814783719')],
      },
      {
        title: 'Emotive Resonance',
        date: '2025-01-25',
        trackCount: 10,
        cover: COVER('zynthar', 'emotive-resonance'),
        theme: 'The whole range of feeling, from rage to joy.',
        links: [{ kind: 'apple-music', url: 'https://music.apple.com/us/album/emotive-resonance/1792793773' }],
      },
      {
        title: 'Shadows Within',
        date: '2025-01-16',
        trackCount: 10,
        cover: COVER('zynthar', 'shadows-within'),
        theme: 'Creative crisis and facing your own shadow.',
        links: [{ kind: 'apple-music', url: 'https://music.apple.com/us/album/shadows-within/1791330257' }],
      },
      {
        title: 'Echoes of the Rift',
        date: '2024-12-30',
        trackCount: 10,
        cover: COVER('zynthar', 'echoes-of-the-rift'),
        theme: 'The debut: personal struggle, broken bonds and the search for redemption.',
        links: [{ kind: 'apple-music', url: 'https://music.apple.com/us/album/echoes-of-the-rift/1788406787' }],
      },
    ],
    platforms: [
      { kind: 'spotify', url: 'https://open.spotify.com/artist/3z0vh8xXLIMiRxVUthV08h' },
      { kind: 'apple-music', url: 'https://music.apple.com/us/artist/zynthar/1787947789' },
      { kind: 'youtube-music', url: 'https://music.youtube.com/channel/UCEXt4Y45RdsD5TEFufc7KsQ' },
      { kind: 'tidal', url: 'https://tidal.com/artist/52930544' },
      { kind: 'deezer', url: 'https://www.deezer.com/artist/296159441' },
      { kind: 'amazon-music', url: 'https://music.amazon.com/artists/B0DRWM9WYV/zynthar' },
      { kind: 'boomplay', url: 'https://www.boomplay.com/artists/104325401' },
      { kind: 'instagram', url: 'https://www.instagram.com/zynthar_official' },
      { kind: 'facebook', url: 'https://www.facebook.com/zynthar.official' },
    ],
    website: 'https://zynthar.rocks',
    blogTag: 'zynthar',
  },
  {
    slug: 'diva-rogue',
    name: 'Diva Rogue',
    tagline: 'An AI R&B and hip-hop artist from a neon-lit Brooklyn night.',
    motto: 'The crown\'s mine. I\'m just coming to get it.',
    genres: ['R&B', 'Pop', 'Hip-hop', 'Rap'],
    aiDisclosure: 'Diva Rogue is an AI artist. I created the character and write and produce her music with generative AI tools; her Brooklyn backstory is the character\'s lore, not a biography.',
    concept: [
      'Diva Rogue is a character: a bold Brooklyn voice, cinematic, street-glam and unapologetically ambitious. Her story is about survival, independence and ambition, told over gritty East Coast beats.',
      'Where Zynthar is conflict and release, Diva Rogue is the city at night: sensual, stylish and confident, with a sharp edge.',
    ],
    hero: {
      src: '/media/blog/how-i-started-making-music-with-ai/diva_rogue-6bf6ee1412.webp',
      alt: 'Diva Rogue album cover art',
    },
    spotifyArtistId: '2K6A8QQQ7b0xHeNmYpJj5f',
    releases: [
      {
        title: 'House of Desire',
        date: '2026-05-01',
        trackCount: 10,
        cover: STORED_COVER('R7d7wkKSAklQ'),
        theme: 'A woman enters a seductive world of desire, learns its rules and finds power in owning her role within it.',
        spotifyAlbumId: '1s7gFBTlixXAic8UPMV5WE',
        links: [
          { kind: 'spotify', url: 'https://open.spotify.com/album/1s7gFBTlixXAic8UPMV5WE' },
          APPLE_ALBUM('6765764529'),
          { kind: 'youtube-music', url: 'https://music.youtube.com/playlist?list=OLAK5uy_mBYAGXPouM6eo8-QRUfaKnoqUAee6ARXY' },
        ],
      },
      {
        title: 'Soft Power Protocol',
        date: '2026-02-11',
        trackCount: 10,
        cover: STORED_COVER('Nucx3md3WZ3O'),
        theme: 'Quiet strength in a world of codes and gatekeepers: a voice that wins by staying calm, sharp and impossible to ignore.',
        spotifyAlbumId: '5A72VKnr6pexCkqw9YIvxc',
        links: [SPOTIFY_ALBUM('5A72VKnr6pexCkqw9YIvxc'), APPLE_ALBUM('1877078911')],
      },
      {
        title: 'True Anyway',
        date: '2025-05-21',
        trackCount: 10,
        cover: STORED_COVER('ulHFhUTU0Iy3'),
        theme: 'Loyalty under pressure: standing firm, choosing the same person twice and keeping your word when no one is watching.',
        spotifyAlbumId: '205TXFXa3zHtwqVmrS9oBo',
        links: [SPOTIFY_ALBUM('205TXFXa3zHtwqVmrS9oBo'), APPLE_ALBUM('1816086218')],
      },
      {
        title: 'Opaline Fever',
        date: '2025-05-14',
        trackCount: 10,
        cover: STORED_COVER('aYvJEBzP2LCq'),
        theme: 'A cinematic fever dream of perfume, velvet and lies, where love feels artificial and every kiss comes in code.',
        spotifyAlbumId: '4gAd80KOynwPuJiIXzgAcu',
        links: [SPOTIFY_ALBUM('4gAd80KOynwPuJiIXzgAcu'), APPLE_ALBUM('1814498319')],
      },
      {
        title: 'Storms & Sisters',
        date: '2025-05-07',
        trackCount: 10,
        cover: STORED_COVER('35tkHwggwJZ7'),
        theme: 'Heartbreak weathered together: ghosted calls, burned-out fire and the friends who hold you until the rain stops.',
        spotifyAlbumId: '7EVipmGPvvI0axcJaobCJo',
        links: [SPOTIFY_ALBUM('7EVipmGPvvI0axcJaobCJo'), APPLE_ALBUM('1813202868')],
      },
      {
        title: 'Bloom Season',
        date: '2025-04-30',
        trackCount: 10,
        cover: STORED_COVER('JuVEcJX4FuQK'),
        theme: 'A light, sunny record of spring days, park benches and weekend markets, and a feeling that grows on its own.',
        spotifyAlbumId: '5dXLWTLnUv0Dy7y1g6eB8C',
        links: [SPOTIFY_ALBUM('5dXLWTLnUv0Dy7y1g6eB8C'), APPLE_ALBUM('1811722645')],
      },
      {
        title: 'New Me',
        date: '2025-04-23',
        trackCount: 10,
        cover: STORED_COVER('0ihwhpFgGaAB'),
        theme: 'A road record: packing the boxes, leaving town and finding a new self somewhere between motels and the next exit.',
        spotifyAlbumId: '3kG7tetgT0ldOxwIXDbpNY',
        links: [SPOTIFY_ALBUM('3kG7tetgT0ldOxwIXDbpNY'), APPLE_ALBUM('1810253555')],
      },
      {
        title: 'Bridges & Beats',
        date: '2025-04-16',
        trackCount: 10,
        cover: STORED_COVER('KAU2sqHmQV_i'),
        theme: 'A trip across cities and languages, from Harlem to Havana, about the rhythm and the sky everyone shares.',
        spotifyAlbumId: '5RAcDLmWI4ZkU2sFHX9kIM',
        links: [SPOTIFY_ALBUM('5RAcDLmWI4ZkU2sFHX9kIM'), APPLE_ALBUM('1808928322')],
      },
      {
        title: 'Scars of Life',
        date: '2025-04-09',
        trackCount: 10,
        cover: STORED_COVER('M-0bfxnw8MSo'),
        theme: 'Brooklyn grit and silence fourteen floors up: a woman forges her own armor, with no apologies and nothing bought.',
        spotifyAlbumId: '1VejATHCk9UpnDm9Hie8hx',
        links: [SPOTIFY_ALBUM('1VejATHCk9UpnDm9Hie8hx'), APPLE_ALBUM('1807575223')],
      },
      {
        title: 'Raindrops Places',
        date: '2025-04-02',
        trackCount: 11,
        cover: STORED_COVER('UdmXU6Cy5Q3u'),
        theme: 'A softer, dreamlike album of rainy mornings, small mistakes and big people, ending in a reason to sing.',
        spotifyAlbumId: '4IqCQx4ZbWK9nV9rlTIuWM',
        links: [SPOTIFY_ALBUM('4IqCQx4ZbWK9nV9rlTIuWM'), APPLE_ALBUM('1806192332')],
      },
      {
        title: 'Concrete Roses',
        date: '2025-03-13',
        trackCount: 10,
        cover: COVER('diva-rogue', 'concrete-roses'),
        theme: 'Growing through the cracks: a city-born story of blooming without water and turning pavement into gold.',
        spotifyAlbumId: '4EtbNbUVpgiuQNkWbwARPN',
        links: [SPOTIFY_ALBUM('4EtbNbUVpgiuQNkWbwARPN'), APPLE_ALBUM('1802014617')],
      },
      {
        title: 'Rebel Heart',
        date: '2025-03-03',
        trackCount: 10,
        cover: STORED_COVER('EqS3HiHcyFgx'),
        theme: 'Restless and untamed: bad love, runaway nights and a heart that refuses to be anyone\'s saint or sinner.',
        spotifyAlbumId: '5nR7OEqtFdu8jbYKvbQnjH',
        links: [SPOTIFY_ALBUM('5nR7OEqtFdu8jbYKvbQnjH'), APPLE_ALBUM('1800026403')],
      },
      {
        title: 'No Queen, No Kingdom',
        date: '2025-02-19',
        trackCount: 10,
        cover: STORED_COVER('nm5GXv08_UA5'),
        theme: 'Ruling alone: the fairytale is over, and she stays unbreakable without a king, a crown or a throne.',
        spotifyAlbumId: '65IWfokvpjID0PBn4lpR6W',
        links: [SPOTIFY_ALBUM('65IWfokvpjID0PBn4lpR6W'), APPLE_ALBUM('1797946525')],
      },
      {
        title: 'Alpha Femme',
        date: '2025-02-12',
        trackCount: 10,
        cover: COVER('diva-rogue', 'alpha-femme'),
        theme: 'Confidence with a sharp edge: breaking glass ceilings, dripping in gold and staying loyal to herself first.',
        spotifyAlbumId: '5Fru0vsyabp9huKEQgyjpa',
        links: [SPOTIFY_ALBUM('5Fru0vsyabp9huKEQgyjpa'), APPLE_ALBUM('1796642920')],
      },
      {
        title: 'Savage Grace',
        date: '2025-02-05',
        trackCount: 10,
        cover: COVER('diva-rogue', 'savage-grace'),
        theme: 'All eyes on her: the diva steps into the night, praying, running and crying royal tears without losing her grace.',
        spotifyAlbumId: '2BhxBfA6ZFWvOQDpWODoPb',
        links: [SPOTIFY_ALBUM('2BhxBfA6ZFWvOQDpWODoPb'), APPLE_ALBUM('1795483196')],
      },
      {
        title: 'Rogue Royalty',
        date: '2025-01-29',
        trackCount: 10,
        cover: COVER('diva-rogue', 'rogue-royalty'),
        theme: 'The party at the top: diamonds, ego trips and greed, and the ruin that comes with a crown built on hype.',
        spotifyAlbumId: '6MOxfRgTDh5gY7XwVLUPpg',
        links: [SPOTIFY_ALBUM('6MOxfRgTDh5gY7XwVLUPpg'), APPLE_ALBUM('1793858064')],
      },
      {
        title: 'Queen Without a Kingdom',
        date: '2025-01-22',
        trackCount: 10,
        cover: COVER('diva-rogue', 'queen-without-a-kingdom'),
        theme: 'The debut: a queen with a concrete tiara and nothing but her own power, claiming a crown no one handed her.',
        spotifyAlbumId: '6pRO4eAPKsiCAkDN78p7An',
        links: [SPOTIFY_ALBUM('6pRO4eAPKsiCAkDN78p7An'), APPLE_ALBUM('1792196767')],
      },
    ],
    platforms: [
      { kind: 'spotify', url: 'https://open.spotify.com/artist/2K6A8QQQ7b0xHeNmYpJj5f' },
      { kind: 'apple-music', url: 'https://music.apple.com/us/artist/diva-rogue/1791819506' },
      { kind: 'youtube-music', url: 'https://music.youtube.com/channel/UCyL7JwGQ1np26mGPcG52QTg' },
      { kind: 'youtube', url: 'https://www.youtube.com/@diva_rogue' },
      { kind: 'deezer', url: 'https://www.deezer.com/artist/299318331' },
      { kind: 'instagram', url: 'https://www.instagram.com/diva.rogue' },
    ],
    website: 'https://divarogue.com',
    blogTag: 'diva-rogue',
  },
]

export const MUSIC_PATH = '/music'

export function musicPath(project: Pick<MusicProject, 'slug'>): string {
  return `${MUSIC_PATH}/${project.slug}`
}

export function musicProjectBySlug(slug: string): MusicProject | undefined {
  return MUSIC_PROJECTS.find(p => p.slug === slug)
}

/** Total tracks across releases that state a count. */
export function trackTotal(project: MusicProject): number {
  return project.releases.reduce((n, r) => n + (r.trackCount ?? 0), 0)
}

export function spotifyEmbedUrl(kind: 'album' | 'artist', id: string): string {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`
}

/** Spotify ids are 22 characters of base62. */
export const SPOTIFY_ID_RX = /^[0-9A-Z]{22}$/i

/** Every page under /music. Read by the prerender list and the sitemap. */
export const MUSIC_PAGE_PATHS: string[] = [MUSIC_PATH, ...MUSIC_PROJECTS.map(musicPath)]
