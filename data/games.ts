import type { ExternalLink, ProjectStatus } from './projects'

// The games shown under /games.
//
// The point of these pages is the author, not the studio: xploit.games is the
// storefront, so each entry here leads with `role` — what Andrei personally
// designed and built — and keeps the marketing copy short.
//
// Facts must be checkable. Store data comes from the store listings, game
// mechanics from the devlogs on this site. Leave a field out rather than guess:
// an empty `role` hides the block, a missing `releaseDate` hides the date.

export interface Screenshot {
  /** Under public/games/<slug>/. */
  src: string
  alt: string
  width: number
  height: number
}

/** Files are named screenshot-1.webp, screenshot-2.webp, … in public/games/<slug>/, in this order. */
function screenshots(slug: string, shots: [width: number, height: number, alt: string][]): Screenshot[] {
  return shots.map(([width, height, alt], i) => ({ src: `/games/${slug}/screenshot-${i + 1}.webp`, alt, width, height }))
}

export interface Game {
  slug: string
  title: string
  status: ProjectStatus
  /** One line under the title and on the hub card. */
  tagline: string
  /** Two or three sentences for the page lead and the meta description. */
  description: string
  genre: string
  /** ISO date, `YYYY-MM-DD` or `YYYY-MM`. Only for released games. */
  releaseDate?: string
  /** Store and play links. The first one is the primary button. */
  links: ExternalLink[]
  /** Official trailer or gameplay video on YouTube. */
  trailerYoutubeId?: string
  /** 16:9 image for the hub card and the page hero. */
  cover: { src: string, alt: string }
  /** In-game screenshots, shown as a gallery under the trailer. */
  screenshots?: Screenshot[]
  features: { title: string, text: string }[]
  /** What Andrei did on this game, as first-person sentences. */
  role: string[]
  stack: string[]
  facts: { label: string, value: string }[]
  /** schema.org `gamePlatform` / `operatingSystem` values. */
  platforms: string[]
  /** Blog tag holding the devlog; `blogPath` for a single post. */
  blogTag?: string
  blogPath?: string
  privacyPolicyPath?: string
  steam?: {
    embed?: string
  }
}

export const GAMES: Game[] = [
  {
    slug: 'tiny-boo-homecoming',
    title: 'Tiny Boo: Homecoming',
    status: 'out-now',
    tagline: 'A cozy mobile adventure about a tiny forest creature finding his way home.',
    description: 'A gust of wind tears Boo away from his home tree and scatters him across a giant magical forest. Leaves are platforms, branches are roads, and the way home is long. A gentle platformer about curiosity, courage and kindness, with no combat.',
    genre: 'Adventure platformer',
    links: [
      { kind: 'app-store', url: 'https://apps.apple.com/app/id6476441950' },
      { kind: 'google-play', url: 'https://play.google.com/store/apps/details?id=com.Ravy.TinyBooHomecoming' },
      { kind: 'website', url: 'https://tiny.boo' },
    ],
    cover: {
      src: '/games/tiny-boo-homecoming/cover.webp',
      alt: 'Tiny Boo: Homecoming logo over the magical forest of Lumia',
    },
    screenshots: screenshots('tiny-boo-homecoming', [
      [1600, 737, 'Boo beside a carnivorous plant on a rainy night in the forest'],
      [1600, 737, 'Boo on a mossy platform under a giant fallen tree'],
      [1600, 737, 'Boo by a glowing rune stone in a sunlit glade'],
      [1600, 737, 'Boo gliding between floating islands of earth and roots'],
      [1600, 1200, 'Boo gliding through a pink sunset forest in the rain'],
      [1600, 1200, 'Boo leaping over a mossy rock in the green canopy'],
    ]),
    features: [
      { title: 'A giant micro-world', text: 'Hand-crafted forest levels seen from the size of an acorn, full of secrets and gentle surprises.' },
      { title: 'Relaxed controls', text: 'Easy to learn, focused on movement, exploration and interaction. No pressure, no rush.' },
      { title: 'Warm sound and visuals', text: 'Soft music and warm art direction built for a calm, cozy session.' },
      { title: 'A story told by the world', text: 'A quiet narrative about home and belonging, carried by places instead of dialogue.' },
    ],
    role: [
      'Founded the project at XPLOIT and assembled the team: concept artists, illustrators and developers.',
      'Built the game in Unity, including cloud saves and analytics on Unity services.',
      'Set up CI/CD builds and shipped the game to Google Play and the App Store.',
      'Wired the business side: rewarded and interstitial ads, in-app purchases, attribution and event analytics.',
      'Localised the game into seven languages.',
    ],
    stack: ['Unity', 'C#', 'Unity Analytics', 'Unity LevelPlay', 'AppsFlyer', 'CI/CD'],
    facts: [
      { label: 'Platforms', value: 'iPhone, iPad, Mac (Apple silicon), Android' },
      { label: 'Languages', value: 'English, Arabic, Hindi, Portuguese, Russian, Simplified Chinese, Spanish' },
      { label: 'Age rating', value: '4+ (App Store)' },
      { label: 'Business model', value: 'Free, with ads and in-app purchases' },
      { label: 'Studio', value: 'XPLOIT' },
    ],
    platforms: ['iOS', 'Android'],
    blogTag: 'tiny-boo',
    privacyPolicyPath: '/docs/tiny-boo-privacy-policy',
  },
  {
    slug: 'sky-ball-the-orion',
    title: 'Sky Ball: The Orion',
    status: 'out-now',
    tagline: 'A minimalist space puzzle with slingshot physics and 160+ levels.',
    description: 'In a silent abstract universe, geometry becomes a language. Each level is a small cosmic puzzle: clear every shape in a single launch using angles and reflections, to a soft lo-fi soundtrack.',
    genre: 'Casual puzzle',
    links: [
      { kind: 'app-store', url: 'https://apps.apple.com/us/app/sky-ball-the-orion/id6754377012' },
      { kind: 'google-play', url: 'https://play.google.com/store/apps/details?id=com.Xploitgames.SkyballTheOrion' },
      { kind: 'website', url: 'https://skyballtheorion.com/' },
    ],
    cover: {
      src: '/games/sky-ball-the-orion/cover.png',
      alt: 'Sky Ball: The Orion key art: a ball and geometric shapes in flat space',
    },
    screenshots: screenshots('sky-ball-the-orion', [
      [1600, 1200, 'Levels built from glowing outlined shapes: a relaxing game with no ads and no internet needed'],
      [1600, 1200, 'A level of four squares: an anti-stress brain puzzle'],
      [1600, 1200, 'Squares and triangles to knock down: develop your thinking skills'],
      [1600, 1200, 'Circles, a diamond and a triangle: knock down shapes with one move'],
    ]),
    features: [
      { title: 'One-shot physics puzzles', text: 'Clear every element in a single launch, using angle and reflection.' },
      { title: 'Minimalist flat space', text: 'A clean geometric visual style inspired by flat space aesthetics.' },
      { title: 'Lo-fi calm', text: 'Soft lo-fi music and a quiet setting make problem-solving meditative.' },
    ],
    role: [],
    stack: [],
    facts: [
      { label: 'Platforms', value: 'iOS, Android' },
      { label: 'Levels', value: '160+' },
      { label: 'Studio', value: 'XPLOIT' },
    ],
    platforms: ['iOS', 'Android'],
  },
  {
    slug: 'tcg-fantasy-card-collection',
    title: 'TCG: FANTASY Card Collection',
    status: 'coming-soon',
    tagline: 'A relaxing fantasy card-collecting game.',
    description: 'Explore a room scattered with thousands of cards, examine rare finds up close, and carefully organise your collection in cabinets by faction and rarity.',
    genre: 'Casual collecting sim',
    links: [
      { kind: 'steam', url: 'https://store.steampowered.com/app/2757440/TCG_FANTASY_Card_Collection/', label: 'Wishlist on Steam' },
    ],
    trailerYoutubeId: 'cmYjFNb2OO0',
    cover: {
      src: 'https://i.ytimg.com/vi/cmYjFNb2OO0/hqdefault.jpg',
      alt: 'TCG: FANTASY Card Collection gameplay: fantasy cards laid out in a room',
    },
    features: [
      { title: 'Collect cards', text: 'Explore the room and discover cards from different factions and rarities.' },
      { title: 'Organise your collection', text: 'Place cards into cabinets and their matching sections, and turn chaos into order.' },
      { title: 'Find rare cards', text: 'Rare and legendary finds get their own display spots.' },
      { title: 'Inspect every card', text: 'Hold cards in your hands, zoom in and rotate them to see both sides.' },
      { title: 'Collect them all', text: 'More than 3,000 cards to find.' },
    ],
    role: [],
    stack: [],
    facts: [
      { label: 'Platform', value: 'Windows 10/11 (64-bit), Steam' },
      { label: 'Mode', value: 'Single-player, Family Sharing' },
      { label: 'Languages', value: '27 (interface)' },
      { label: 'Minimum spec', value: 'i5-10400 / Ryzen 5 3600, 8 GB RAM, GTX 1050 2 GB, DirectX 11' },
      { label: 'Developer and publisher', value: 'XPLOIT' },
    ],
    platforms: ['Windows'],
    steam: {
      embed: 'https://store.steampowered.com/widget/2757440/',
    },
  },
  {
    slug: 'hold-my-helmet',
    title: 'Hold my Helmet',
    status: 'in-development',
    tagline: 'A co-op action game about gladiator trials, for Steam.',
    description: 'The party walks into the arena, an announcer calls the next trial, the traps wake up and a boss comes through the gate. Third person, physics combat, ragdolls and a lot of things that explode, played together over Steam.',
    genre: 'Co-op action',
    cover: {
      src: '/media/blog/atd-devlog-five-weeks-into-the-arena/m_lfLocF-RrB.webp',
      alt: 'The iron-bound gates of the Hold my Helmet gladiator arena standing open',
    },
    links: [],
    features: [
      { title: 'Gladiator trials', text: 'A director runs the sequence: doors open, the boss walks out, rewards are paid and the shop opens for the break.' },
      { title: 'Physics combat', text: 'Fifteen weapon profiles from bare fists to dynamite, full-body ragdolls and body parts that can be knocked off and repaired.' },
      { title: 'Co-op over Steam', text: 'Lobbies, friends, spectator mode for whoever is down, and a pet who will carry a live grenade if nobody stops him.' },
    ],
    role: [
      'Designed the Arena Trial Director, the state machine every other system listens to.',
      'Took the game online in four days: host-authoritative netcode on Mirror over Steam, client-side prediction with input replay, and interpolation for everyone else.',
      'Rebuilt the HUD as 11 independent views on my own HTML/CSS/JS UI engine, cutting CPU per frame by 97%.',
      'Wrote the Blender-to-Unity pipeline that rebuilds the arena\'s materials, prefabs and scene from an export.',
      'Built the audio system: a 64-voice pool, a music director that follows the fight, and multiplayer sound that costs no bandwidth.',
    ],
    stack: ['Unity', 'C#', 'Mirror', 'Steamworks', 'Blender', 'XPLOIT Game UI', 'Vue'],
    facts: [
      { label: 'Started', value: '8 September 2026' },
      { label: 'Gameplay code', value: 'About 48,000 lines of C#, 71 test files' },
      { label: 'Platform', value: 'Steam (planned)' },
      { label: 'Studio', value: 'XPLOIT' },
    ],
    platforms: ['Windows'],
    blogPath: '/blogs/atd-devlog-five-weeks-into-the-arena',
  },
  {
    slug: 'idled-survival',
    title: 'IDLED Survival',
    status: 'out-now',
    tagline: 'An idle survival RPG on Telegram. Your world keeps living while you sleep.',
    description: 'Resources are gathered automatically, your decisions make the machine more efficient, and collectible cards with random buffs make every run different. A Telegram mini app on a custom TypeScript engine.',
    genre: 'Idle RPG',
    releaseDate: '2023-01-10',
    links: [
      { kind: 'telegram', url: 'https://t.me/idled_bot/game', label: 'Play on Telegram' },
      { kind: 'website', url: 'https://t.me/idled_survival', label: 'Community' },
    ],
    cover: {
      src: '/media/blog/idled-survival/10019-idled-survival-171a9a05e8.webp',
      alt: 'IDLED Survival key art',
    },
    screenshots: screenshots('idled-survival', [
      [1024, 1024, 'A forest clearing arena littered with wreckage'],
      [1024, 1024, 'A ruined city crossroads full of abandoned cars'],
      [1024, 1024, 'A looted supermarket floor'],
      [1024, 1024, 'An isometric city block'],
      [1024, 1024, 'A glowing forest arena at night'],
      [1024, 1024, 'The IDLED Survival hero, armed and ready'],
    ]),
    features: [
      { title: 'Idle progression', text: 'Collect resources, upgrade systems, unlock new zones and scale up, even while you are away.' },
      { title: 'Cards and buffs', text: 'Collectible cards with random buffs add strategy and make every session unique.' },
      { title: 'Dynamic combat', text: 'Fights stay readable and stable even with a large number of enemies on screen.' },
    ],
    role: [
      'Wrote a custom game engine in TypeScript and Vue 3, including my own collision detection and damage calculation.',
      'Designed the card and buff system, and balanced it with in-game analytics.',
      'Built the Telegram bot on Node.js and Telegraf for notifications, polls and sharing.',
    ],
    stack: ['TypeScript', 'Vue 3', 'Node.js', 'Telegraf', 'Telegram Mini Apps'],
    facts: [
      { label: 'Platform', value: 'Telegram mini app' },
      { label: 'Released', value: 'January 2023' },
      { label: 'Studio', value: 'XPLOIT' },
    ],
    platforms: ['Web', 'Telegram'],
    blogTag: 'idled',
  },
]

export const GAMES_PATH = '/games'

export function gamePath(game: Pick<Game, 'slug'>): string {
  return `${GAMES_PATH}/${game.slug}`
}

export function gameBySlug(slug: string): Game | undefined {
  return GAMES.find(g => g.slug === slug)
}

/** Every page under /games. Read by the prerender list and the sitemap. */
export const GAME_PAGE_PATHS: string[] = [GAMES_PATH, ...GAMES.map(gamePath)]
