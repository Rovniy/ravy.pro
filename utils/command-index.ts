import type { BlogPostMeta } from './blog-post'
import type { CommandAction, CommandItem } from './command-search'
import type { TilNoteMeta } from './til'
// Relative imports, not `~/`: nuxt.config.ts imports `commandIcons()` to bundle
// the icons, and the config is loaded before the alias exists.
import { baseData, categoryNames, publicServices, socialNetworks } from '../data'
import { TINY_BOO_MOVIE } from '../data/animation'
import { gamePath, gamePressPath, GAMES } from '../data/games'
import { MUSIC_PROJECTS, musicPath } from '../data/music'
import { OFFERINGS } from '../data/offerings'
import { PLATFORM_META, platformLabel, STATUS_LABEL } from '../data/projects'
import { tilTopic } from '../data/til'

// Everything the ⌘K palette can find, built from the same registries the pages
// render from, so a new tool, game or album is searchable without touching
// this file. Posts come from /api/blog/posts at open time (`postItems`).
//
// Keywords carry Russian synonyms for the pages people look for by name
// ("менторство", "контакты"): the audience is largely Russian-speaking and the
// site is English.

/** Ids of the client-side commands the palette runs (kind: 'run'). */
export const RUN = {
  toggleTheme: 'toggle-theme',
  copyPageLink: 'copy-page-link',
  subscribe: 'subscribe',
} as const

const go = (label: string, path: string, icon = 'mdi:arrow-right'): CommandAction => ({ label, kind: 'navigate', value: path, icon })
const open = (label: string, url: string, icon = 'mdi:open-in-new'): CommandAction => ({ label, kind: 'external', value: url, icon })

const year = (date: string) => date.slice(0, 4)

function actionItems(): CommandItem[] {
  const email = baseData.me.email
  const telegram = socialNetworks.find(s => s.name === 'Telegram')?.href
  return [
    {
      id: 'action:write',
      type: 'action',
      title: 'Write to Andrei',
      subtitle: email,
      keywords: ['email', 'mail', 'contact', 'hire', 'message', 'написать', 'почта', 'связаться', 'контакт'],
      icon: 'mdi:email-fast-outline',
      actions: [
        { label: 'Write', kind: 'mail', value: `mailto:${email}`, icon: 'mdi:email-outline' },
        { label: 'Copy email', kind: 'copy', value: email, icon: 'mdi:content-copy' },
      ],
      priority: 9,
    },
    ...(telegram
      ? [{
          id: 'action:telegram',
          type: 'action' as const,
          title: 'Message on Telegram',
          subtitle: telegram.replace('https://', ''),
          keywords: ['telegram', 'tg', 'chat', 'dm', 'телеграм', 'написать'],
          icon: 'mdi:send',
          actions: [open('Write', telegram, 'mdi:send'), { label: 'Copy link', kind: 'copy' as const, value: telegram, icon: 'mdi:content-copy' }],
          priority: 8,
        }]
      : []),
    {
      id: 'action:work-with-me',
      type: 'action',
      title: 'Work with me',
      subtitle: 'Mentorship, consulting, fractional CTO',
      keywords: ['hire', 'services', 'consulting', 'job', 'работа', 'услуги', 'нанять'],
      icon: 'mdi:handshake-outline',
      actions: [go('Go', '/services'), go('Send a request', '/services#inquiry', 'mdi:form-select')],
      priority: 8,
    },
    {
      id: 'action:theme',
      type: 'action',
      title: 'Switch theme',
      subtitle: 'Dark ↔ light',
      keywords: ['dark', 'light', 'mode', 'color', 'тема', 'темная', 'светлая'],
      icon: 'mdi:theme-light-dark',
      actions: [{ label: 'Switch', kind: 'run', value: RUN.toggleTheme, icon: 'mdi:theme-light-dark' }],
      priority: 6,
    },
    {
      id: 'action:copy-link',
      type: 'action',
      title: 'Copy link to this page',
      keywords: ['share', 'url', 'link', 'поделиться', 'ссылка'],
      icon: 'mdi:link-variant',
      actions: [{ label: 'Copy', kind: 'run', value: RUN.copyPageLink, icon: 'mdi:content-copy' }],
      priority: 5,
    },
    {
      id: 'action:subscribe',
      type: 'action',
      title: 'Subscribe to the newsletter',
      subtitle: 'Occasional notes, no spam',
      keywords: ['newsletter', 'email', 'updates', 'subscribe', 'подписка', 'рассылка'],
      icon: 'mdi:email-newsletter',
      actions: [{ label: 'Subscribe', kind: 'run', value: RUN.subscribe, icon: 'mdi:bell-ring-outline' }, open('RSS feed', '/rss.xml', 'mdi:rss')],
      priority: 5,
    },
  ]
}

function pageItems(): CommandItem[] {
  const page = (id: string, title: string, path: string, icon: string, subtitle: string, keywords: string[], priority = 4): CommandItem =>
    ({ id: `page:${id}`, type: 'page', title, subtitle, keywords, icon, actions: [go('Go', path)], priority })
  return [
    page('home', 'Home', '/', 'mdi:home-outline', 'Start page', ['main', 'index', 'главная'], 2),
    page('blogs', 'Blog', '/blogs', 'mdi:post-outline', 'Every post', ['blogs', 'posts', 'articles', 'writing', 'блог', 'статьи'], 6),
    page('til', 'Today I Learned', '/til', 'mdi:lightbulb-on-outline', 'Short notes: one problem, one fix', ['til', 'notes', 'tips', 'snippets', 'заметки', 'советы'], 5),
    page('categories', 'Categories', '/categories', 'mdi:tag-multiple-outline', 'Posts by topic', ['tags', 'topics', 'категории', 'теги']),
    page('tools', 'Tools', '/tools', 'mdi:tools', 'Free browser tools', ['utilities', 'инструменты', 'утилиты'], 5),
    page('projects', 'Projects', '/projects', 'mdi:shape-outline', 'Games, music and animation', ['portfolio', 'work', 'проекты', 'портфолио'], 6),
    page('games', 'Games', '/games', 'mdi:gamepad-variant-outline', 'Every XPLOIT game', ['xploit', 'gamedev', 'игры'], 5),
    page('music', 'Music', '/music', 'mdi:music-note-outline', 'Zynthar and Diva Rogue', ['ai music', 'albums', 'музыка', 'альбомы'], 5),
    page('animation', TINY_BOO_MOVIE.title, TINY_BOO_MOVIE.path, 'mdi:movie-open-outline', 'AI-animated series', ['animation', 'cartoon', 'series', 'youtube', 'мультфильм', 'анимация'], 4),
    page('services', 'Services', '/services', 'mdi:briefcase-outline', 'Ways to work together', ['hire', 'consulting', 'услуги'], 5),
    page('about', 'About', '/about', 'mdi:account-outline', 'Background, experience, stack', ['cv', 'resume', 'bio', 'experience', 'обо мне', 'резюме', 'опыт'], 6),
    page('now', 'Now', '/now', 'mdi:clock-outline', 'What I\'m doing right now', ['current', 'status', 'сейчас'], 4),
    page('contacts', 'Contacts', '/contacts', 'mdi:card-account-mail-outline', 'All the ways to reach me', ['contact', 'reach', 'контакты', 'связаться'], 5),
    page('links', 'Links', '/links', 'mdi:link-variant', 'Every project link in one place', ['ссылки']),
    page('privacy', 'Privacy policy', '/docs/privacy-policy', 'mdi:shield-account-outline', 'Docs', ['privacy', 'gdpr', 'конфиденциальность'], 1),
    page('terms', 'Terms of use', '/docs/terms-of-use', 'mdi:file-document-outline', 'Docs', ['terms', 'условия'], 1),
    {
      id: 'page:cv',
      type: 'page',
      title: 'Curriculum vitae (PDF)',
      subtitle: 'Full professional history',
      keywords: ['cv', 'resume', 'pdf', 'резюме'],
      icon: 'mdi:file-account-outline',
      actions: [open('Open', '/misc/andrei_rovnyi_cv.pdf', 'mdi:file-pdf-box')],
      priority: 3,
    },
  ]
}

function toolItems(): CommandItem[] {
  return publicServices.map(tool => ({
    id: `tool:${tool.path}`,
    type: 'tool' as const,
    title: tool.name,
    subtitle: tool.blurb,
    keywords: ['tool', tool.tag, tool.meta].filter(Boolean) as string[],
    icon: tool.icon,
    actions: [go('Try', tool.path, 'mdi:play-circle-outline'), ...(tool.story ? [go('Read the story', tool.story, 'mdi:post-outline')] : [])],
    priority: tool.featured ? 5 : 4,
  }))
}

function serviceItems(): CommandItem[] {
  return OFFERINGS.map(o => ({
    id: `service:${o.id}`,
    type: 'service' as const,
    title: o.name,
    subtitle: o.tagline,
    keywords: ['service', 'hire', o.meta, ...(o.id === 'mentorship' ? ['менторство', 'наставник', 'трудоустройство', 'работа в it'] : []), ...(o.id === 'consulting' ? ['консультация', 'консалтинг'] : []), ...(o.id === 'fractional-cto' ? ['cto', 'техдир'] : [])],
    icon: 'mdi:briefcase-outline',
    actions: o.cta.kind === 'page'
      ? [go('Learn more', o.cta.path), go('Send a request', `/services?service=${o.id}#inquiry`, 'mdi:email-fast-outline')]
      : [go('Send a request', `/services?service=${o.id}#inquiry`, 'mdi:email-fast-outline')],
    priority: 5,
  }))
}

function gameItems(): CommandItem[] {
  return GAMES.flatMap((g) => {
    const store = g.links.find(l => l.kind !== 'website')
    const item: CommandItem = {
      id: `game:${g.slug}`,
      type: 'game',
      title: g.title,
      subtitle: `${g.genre} · ${STATUS_LABEL[g.status]}`,
      keywords: [g.tagline, ...g.platforms, ...g.stack, 'game', 'игра'],
      icon: 'mdi:gamepad-variant-outline',
      image: g.cover.src.startsWith('/') ? g.cover.src : undefined,
      actions: [
        go('Open', gamePath(g)),
        ...(store ? [open(platformLabel(store), store.url, PLATFORM_META[store.kind].icon)] : []),
        go('Press kit', gamePressPath(g), 'mdi:newspaper-variant-outline'),
      ],
      priority: 5,
    }
    const press: CommandItem = {
      id: `game-press:${g.slug}`,
      type: 'game',
      title: `${g.title} press kit`,
      subtitle: 'Facts, descriptions, logo and screenshots',
      keywords: ['press', 'media', 'presskit', 'пресс-кит', 'пресса'],
      icon: 'mdi:newspaper-variant-outline',
      actions: [go('Open', gamePressPath(g))],
      priority: 1,
    }
    return [item, press]
  })
}

function musicItems(): CommandItem[] {
  return MUSIC_PROJECTS.flatMap((p) => {
    const spotify = p.platforms.find(l => l.kind === 'spotify')
    const artist: CommandItem = {
      id: `music:${p.slug}`,
      type: 'music',
      title: p.name,
      subtitle: `${p.genres.join(', ')} · AI music project`,
      keywords: [p.tagline, 'artist', 'band', 'музыка', 'группа'],
      icon: 'mdi:account-music-outline',
      image: p.hero.src.startsWith('/') ? p.hero.src : undefined,
      actions: [go('Listen', musicPath(p), 'mdi:headphones'), ...(spotify ? [open('Spotify', spotify.url, 'simple-icons:spotify')] : [])],
      priority: 5,
    }
    const albums: CommandItem[] = p.releases.map((r) => {
      const onSpotify = r.links.find(l => l.kind === 'spotify')
      return {
        id: `album:${p.slug}:${r.title}`,
        type: 'album' as const,
        title: r.title,
        subtitle: `${p.name} · ${year(r.date)}${r.trackCount ? ` · ${r.trackCount} tracks` : ''}`,
        keywords: [p.name, r.theme ?? '', 'album', 'альбом'],
        icon: 'mdi:album',
        image: r.cover.startsWith('/') ? r.cover : undefined,
        actions: [
          ...(onSpotify ? [open('Play on Spotify', onSpotify.url, 'simple-icons:spotify')] : r.links[0] ? [open(`Listen on ${platformLabel(r.links[0])}`, r.links[0].url)] : []),
          go(`Open ${p.name}`, musicPath(p), 'mdi:account-music-outline'),
        ],
        priority: 2,
      }
    })
    return [artist, ...albums]
  })
}

function socialItems(): CommandItem[] {
  return socialNetworks
    .filter(s => /^https?:\/\//.test(s.href))
    .map(s => ({
      id: `social:${s.name}`,
      type: 'social' as const,
      title: s.name,
      subtitle: s.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
      keywords: ['profile', 'social', 'соцсети'],
      icon: s.icon,
      actions: [open('Open profile', s.href)],
      priority: 2,
    }))
}

/** Everything that ships with the site. Built once per palette mount. */
export function staticCommandItems(): CommandItem[] {
  return [
    ...actionItems(),
    ...pageItems(),
    ...toolItems(),
    ...serviceItems(),
    ...gameItems(),
    ...musicItems(),
    {
      id: 'social:tiny-boo-movie',
      type: 'social',
      title: `${TINY_BOO_MOVIE.title} on YouTube`,
      subtitle: 'Episodes and shorts',
      keywords: ['youtube', 'channel', 'episodes', 'мультфильм'],
      icon: 'simple-icons:youtube',
      actions: [open('Watch', TINY_BOO_MOVIE.channelUrl, 'simple-icons:youtube')],
      priority: 2,
    },
    ...socialItems(),
  ]
}

/** Published posts from /api/blog/posts. */
export function postItems(posts: Array<Partial<BlogPostMeta> & { path?: string }>): CommandItem[] {
  return posts
    .filter(p => p.path && p.title)
    .map(p => ({
      id: `post:${p.path}`,
      type: 'post' as const,
      title: p.title!,
      subtitle: p.description,
      keywords: (p.tags ?? []).flatMap(t => [t, categoryNames[t as keyof typeof categoryNames] ?? '']),
      icon: 'mdi:post-outline',
      image: p.image?.startsWith('/') ? p.image : undefined,
      actions: [
        go('Read', p.path!, 'mdi:book-open-page-variant-outline'),
        { label: 'Copy link', kind: 'copy' as const, value: `${baseData.site.url}${p.path}`, icon: 'mdi:link-variant' },
      ],
      priority: p.trending ? 3 : 1,
    }))
}

/** Published TIL notes from /api/til/notes. */
export function noteItems(notes: Array<Partial<TilNoteMeta>>): CommandItem[] {
  return notes
    .filter(n => n.path && n.title)
    .map(n => ({
      id: `note:${n.path}`,
      type: 'note' as const,
      title: n.title!,
      subtitle: n.excerpt,
      keywords: ['til', ...(n.topics ?? []).flatMap(t => [t, tilTopic(t)?.name ?? ''])],
      icon: 'mdi:lightbulb-on-outline',
      actions: [
        go('Read', n.path!, 'mdi:book-open-page-variant-outline'),
        { label: 'Copy link', kind: 'copy' as const, value: `${baseData.site.url}${n.path}`, icon: 'mdi:link-variant' },
      ],
      priority: 1,
    }))
}

/** Icons the palette itself renders by literal name. */
const CHROME_ICONS = ['mdi:lightbulb-on-outline', 'mdi:magnify', 'mdi:keyboard-return', 'mdi:history', 'mdi:auto-fix', 'mdi:post-outline', 'mdi:book-open-page-variant-outline', 'mdi:link-variant']

/**
 * Every icon the palette can show. Item icons are bound at runtime, which the
 * @nuxt/icon scanner cannot see, so nuxt.config.ts spreads this into
 * `icon.clientBundle.icons`. Without it each one would be a request to the icon
 * API on first open.
 */
export function commandIcons(): string[] {
  const icons = new Set(CHROME_ICONS)
  for (const item of staticCommandItems()) {
    icons.add(item.icon)
    for (const a of item.actions) {
      if (a.icon)
        icons.add(a.icon)
    }
  }
  return [...icons]
}

/** Group headings in display order. */
export const TYPE_LABEL: Record<CommandItem['type'], string> = {
  action: 'Quick actions',
  page: 'Pages',
  post: 'Posts',
  note: 'TIL notes',
  tool: 'Tools',
  service: 'Services',
  game: 'Games',
  music: 'Music',
  album: 'Albums',
  social: 'Profiles',
}

/** Filter chips. `types` lists what each one shows. */
export const SCOPES = [
  { id: 'all', label: 'All', types: null },
  { id: 'posts', label: 'Posts', types: ['post', 'note'] },
  { id: 'tools', label: 'Tools', types: ['tool'] },
  { id: 'games', label: 'Games', types: ['game'] },
  { id: 'music', label: 'Music', types: ['music', 'album'] },
  { id: 'pages', label: 'Pages', types: ['page', 'service', 'social'] },
  { id: 'actions', label: 'Actions', types: ['action'] },
] as const satisfies ReadonlyArray<{ id: string, label: string, types: ReadonlyArray<CommandItem['type']> | null }>

export type ScopeId = typeof SCOPES[number]['id']
