// Tiny Boo Movie — the AI-animated series shown at /animation/tiny-boo.
//
// Episodes are listed in season order. Add one by its YouTube id once it is
// public; the page and the sitemap pick it up from here.

export interface Episode {
  /** "S1 · E1". */
  code: string
  title: string
  youtubeId: string
  /** When YouTube published it (ISO 8601). Required by Google for VideoObject. */
  uploadDate: string
  /** One line on what happens. */
  logline: string
}

export const TINY_BOO_MOVIE = {
  slug: 'tiny-boo',
  path: '/animation/tiny-boo',
  title: 'Tiny Boo Movie',
  tagline: 'Cozy, wordless adventures of a tiny forest spirit.',
  description: 'An AI-animated YouTube series set in Lumia, the world of the game Tiny Boo: Homecoming. Boo is the size of an acorn and a long way from home. No words, just feelings. I write, direct and produce it, with an AI video pipeline built for the series.',
  channelUrl: 'https://www.youtube.com/@TinyBooLumia',
  hero: {
    src: '/media/blog/how-we-made-the-first-episode-of-tiny-boo/how_we_made_the_first_episode_of_tiny_boo-eb3c796ff1.webp',
    alt: 'Tiny Boo at the edge of a giant forest',
  },
  season: {
    name: 'Season 1: The Long Way Home',
    text: 'A storm tears Boo and his friends off their home tree and scatters them across the wild forest. Each episode is a stop on the road back, through four shades of forest, and the promises Boo makes along the way pay off in the finale.',
  },
  episodes: [
    {
      code: 'S1 · E1',
      title: 'Carried Away',
      youtubeId: 'SnM8GiVSY6Y',
      uploadDate: '2026-06-09T12:22:35-07:00',
      logline: 'A storm takes Boo far from home, and he takes his first step back.',
    },
    {
      code: 'S1 · E2',
      title: 'The Dewdrop',
      youtubeId: 'vb_KBaEMviA',
      uploadDate: '2026-05-31T04:33:37-07:00',
      logline: 'Boo wants a sip from a giant dewdrop, and it turns into a tiny adventure.',
    },
  ] satisfies Episode[],
  /** Why the series is built the way it is. */
  decisions: [
    { title: 'Wordless by design', text: 'No dialogue means no language barrier and no lip-sync problem in AI video. Boo speaks through his ears, eyes and the cape he holds onto.' },
    { title: 'A character lock', text: 'Front, profile and expression sheets fix Boo\'s look, and the same traits go into every shot, so he stays the same creature from frame to frame.' },
    { title: 'Structure before generation', text: 'A series bible, location sheets with palette and scale, and written craft rules for directing, camera, light and VFX come before any shot is generated.' },
  ],
  pipeline: [
    { name: 'Bible and story', text: 'Format, audience, tone and the season arc, written down before anything is generated.' },
    { name: 'Character and world sheets', text: 'Reference sheets for every character and a passport for every location.' },
    { name: 'Script and shot list', text: 'Each episode is written in action, not lines, and split into shots of three to eight seconds.' },
    { name: 'Shot generation', text: 'One prompt per shot with a fixed part (style, character, palette) and a variable part (action, camera), generated in Seedance.' },
    { name: 'Music and sound', text: 'A single score per episode generated separately in Suno, plus effects and Boo\'s wordless voice.' },
    { name: 'Edit and publish', text: 'Assembled in the edit, then cut down into Shorts that lead back to the episodes.' },
  ],
  tools: ['Claude', 'ChatGPT (character art)', 'Seedance 2', 'Suno', 'DaVinci Resolve'],
  characterSheet: {
    src: '/media/blog/how-we-made-the-first-episode-of-tiny-boo/tiny-boo-emotions-eeed8b9573.webp',
    alt: 'Tiny Boo model sheet with his emotions',
    width: 5016,
    height: 3762,
  },
  blogTag: 'animation',
  game: '/games/tiny-boo-homecoming',
}

/** Every page under /animation. Read by the prerender list and the sitemap. */
export const ANIMATION_PAGE_PATHS: string[] = [TINY_BOO_MOVIE.path]
