/**
 * Pure helpers for the TIL notes at /til.
 *
 * A note is a blog post's small sibling: one question as the title, a few
 * lines of markdown, one or more topics, no cover, no description field. The
 * description every page and feed needs is derived from the body (`excerpt`),
 * so writing a note from a phone is a title and three lines.
 *
 * Like `utils/blog-post.ts`, nothing here touches Firebase, Nuxt or h3. The
 * Firestore access lives in `server/utils/til-store.ts`.
 */

import { TIL_TOPIC_IDS, tilTopic, tilTopicPath } from '../data/til'
import { findEmbedProblems } from './blog-embeds'
import { isValidSlug } from './blog-post'

export interface TilNoteMeta {
  /** Stored, never re-derived, for the same reason as a post's `path`. */
  path: string
  slug: string
  /** The question the note answers. Becomes the h1, `<title>` and og:title. */
  title: string
  topics: string[]
  /** Plain-text summary of the body: meta description, feeds, cards. */
  excerpt: string
  published: boolean
  createdAt: string
  lastUpdated: string
}

export interface TilNoteRecord extends TilNoteMeta {
  markdown: string
}

/** Longer than this is a blog post, not a note. */
export const NOTE_MAX_CHARS = 4000
export const NOTE_TITLE_MAX = 110
const EXCERPT_MAX = 160

/** Slugs taken by routes under /til and by the studio. */
export const RESERVED_NOTE_SLUGS = new Set(['new', 'topic', 'rss'])

export function notePath(slug: string): string {
  return `/til/${slug}`
}

/** `/til/foo` → `foo`; '' for anything else, including topic hubs. */
export function noteSlugFromPath(path: string): string {
  const match = /^\/til\/([^/]+)\/?$/.exec(String(path ?? ''))
  return match && match[1] !== 'topic' ? match[1]! : ''
}

/**
 * Markdown → one line of plain text. Code blocks are dropped (a meta
 * description full of braces helps nobody), inline code keeps its text,
 * links keep their label.
 */
export function plainText(markdown: string): string {
  return String(markdown ?? '')
    .replace(/```[\s\S]*?(?:```|$)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}|[>\-*+]|\d+\.)\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim()
}

/** First ~160 characters of the body, cut at a word boundary. */
export function excerptOf(markdown: string, fallback = ''): string {
  const text = plainText(markdown)
  if (!text)
    return fallback
  if (text.length <= EXCERPT_MAX)
    return text
  const cut = text.slice(0, EXCERPT_MAX - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 80 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, '')}…`
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function topicList(value: unknown): string[] {
  if (!Array.isArray(value))
    return []
  return [...new Set(value.filter((v): v is string => typeof v === 'string').map(v => v.trim()).filter(Boolean))]
}

export class TilNoteValidationError extends Error {}

export interface NormalizeNoteOptions {
  now: string
  existing?: TilNoteRecord | null
}

/** Validate a payload from the studio or MCP into a storable note. Throws `TilNoteValidationError`. */
export function normalizeNote(input: unknown, opts: NormalizeNoteOptions): TilNoteRecord {
  const raw = (input ?? {}) as Record<string, unknown>
  const existing = opts.existing ?? null

  const slug = str(raw.slug) || existing?.slug || ''
  if (!isValidSlug(slug))
    throw new TilNoteValidationError('Slug must be lowercase letters, digits and single hyphens.')
  if (RESERVED_NOTE_SLUGS.has(slug))
    throw new TilNoteValidationError(`"${slug}" is reserved — pick another slug.`)

  const title = str(raw.title)
  if (!title)
    throw new TilNoteValidationError('Title is required — phrase it as the question the note answers.')
  if (title.length > NOTE_TITLE_MAX)
    throw new TilNoteValidationError(`Title is ${title.length} characters; keep it under ${NOTE_TITLE_MAX}.`)

  const topics = topicList(raw.topics)
  if (!topics.length)
    throw new TilNoteValidationError('Pick at least one topic.')
  const unknown = topics.filter(t => !TIL_TOPIC_IDS.includes(t))
  if (unknown.length)
    throw new TilNoteValidationError(`Unknown topic(s): ${unknown.join(', ')}. Allowed: ${TIL_TOPIC_IDS.join(', ')}.`)

  const markdown = typeof raw.markdown === 'string' ? raw.markdown.trim() : ''
  if (!markdown)
    throw new TilNoteValidationError('The note is empty.')
  if (markdown.length > NOTE_MAX_CHARS)
    throw new TilNoteValidationError(`The note is ${markdown.length} characters. Over ${NOTE_MAX_CHARS} it is a blog post — split it or write a post.`)

  const embedProblems = findEmbedProblems(markdown)
  if (embedProblems.length)
    throw new TilNoteValidationError(embedProblems.join(' | '))

  const createdAt = str(raw.createdAt) || existing?.createdAt || opts.now
  if (createdAt > opts.now)
    throw new TilNoteValidationError('createdAt is in the future.')

  return {
    path: existing?.path || notePath(slug),
    slug,
    title,
    topics,
    excerpt: excerptOf(markdown, title),
    published: raw.published === true,
    createdAt,
    lastUpdated: opts.now,
    markdown,
  }
}

/** Firestore document → note. Never throws; a malformed doc is skipped. */
export function noteFromDoc(data: Record<string, unknown> | undefined, slug: string): TilNoteRecord | null {
  if (!data)
    return null
  const title = str(data.title)
  if (!title)
    return null
  const markdown = typeof data.markdown === 'string' ? data.markdown : ''
  return {
    path: str(data.path) || notePath(slug),
    slug: str(data.slug, slug),
    title,
    topics: topicList(data.topics).filter(t => TIL_TOPIC_IDS.includes(t)),
    excerpt: str(data.excerpt) || excerptOf(markdown, title),
    published: data.published === true,
    createdAt: str(data.createdAt),
    lastUpdated: str(data.lastUpdated) || str(data.createdAt),
    markdown,
  }
}

export function toNoteMeta(note: TilNoteRecord): TilNoteMeta {
  const { markdown: _markdown, ...meta } = note
  return meta
}

/** Newest first; undated last. */
export function sortNotes<T extends { createdAt: string, title: string }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      if (!a.createdAt)
        return 1
      if (!b.createdAt)
        return -1
      return a.createdAt < b.createdAt ? 1 : -1
    }
    return a.title.localeCompare(b.title)
  })
}

/** Notes sharing a topic with `note`, most shared topics first, then newest. */
export function relatedNotes<T extends TilNoteMeta>(note: Pick<TilNoteMeta, 'slug' | 'topics'>, all: T[], limit = 5): T[] {
  return sortNotes(all)
    .filter(n => n.slug !== note.slug)
    .map(n => ({ n, shared: n.topics.filter(t => note.topics.includes(t)).length }))
    .filter(x => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map(x => x.n)
}

/** Every URL a change to `note` touches: the note, the feed and its topic hubs. */
export function notePingPaths(note: Pick<TilNoteMeta, 'path' | 'topics'>): string[] {
  return [note.path, '/til', ...note.topics.map(tilTopicPath)]
}

/** Published notes per topic, for the hub chips. Topics with no notes are left out. */
export function topicCounts(notes: Array<Pick<TilNoteMeta, 'topics'>>): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const note of notes) {
    for (const t of note.topics)
      counts[t] = (counts[t] ?? 0) + 1
  }
  return counts
}

/**
 * Advice shown in the studio and returned by the MCP tools. None of it blocks
 * a save: these are the habits that decide whether a three-line note gets
 * indexed or is dismissed as thin content.
 */
export function noteWarnings(note: Pick<TilNoteRecord, 'title' | 'markdown'>): string[] {
  const warnings: string[] = []
  const hasCode = /```|`[^`\n]+`/.test(note.markdown)
  const hasLink = /\]\(https?:\/\/|https?:\/\/\S+/.test(note.markdown)
  if (!hasCode && !hasLink)
    warnings.push('No code, command or source link. A note with one of them is far more likely to be indexed and trusted.')
  if (plainText(note.markdown).length < 60)
    warnings.push('Very short. Add one line on why it works or where it bit you: that line is what makes the note yours.')
  if (note.markdown.length > 1500)
    warnings.push('Long for a note. If it needs sections, it is probably a blog post.')
  if (note.title.length > 80)
    warnings.push('Long title. Search results cut off around 60 characters.')
  if (/\p{Script=Cyrillic}/u.test(note.title + note.markdown))
    warnings.push('Cyrillic text found. TIL notes are written in English.')
  return warnings
}

const TCO_URL_LENGTH = 23

function hashtagsFor(topics: string[], max: number): string[] {
  const tags = topics.flatMap(t => tilTopic(t)?.hashtags ?? [])
  return [...new Set(tags)].slice(0, max).map(t => `#${t}`)
}

/** A ready-to-paste LinkedIn post for a note. */
export function linkedInPost(note: Pick<TilNoteMeta, 'title' | 'excerpt' | 'topics'>, url: string): string {
  return [
    `TIL: ${note.title}`,
    '',
    note.excerpt,
    '',
    `The fix, with the code: ${url}`,
    '',
    hashtagsFor(note.topics, 4).join(' '),
  ].join('\n').trim()
}

/** A ready-to-paste post for X: title, link and as many hashtags as fit in 280. */
export function xPost(note: Pick<TilNoteMeta, 'title' | 'topics'>, url: string): string {
  let title = `TIL: ${note.title}`
  // X counts every link as 23 characters, whatever its length.
  const room = 280 - TCO_URL_LENGTH - 1
  if (title.length > room)
    title = `${title.slice(0, room - 1).trimEnd()}…`
  let text = `${title}\n${url}`
  let length = title.length + 1 + TCO_URL_LENGTH
  for (const tag of hashtagsFor(note.topics, 3)) {
    if (length + tag.length + 1 > 280)
      break
    text += ` ${tag}`
    length += tag.length + 1
  }
  return text
}

export function linkedInShareUrl(text: string): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`
}

export function xShareUrl(text: string): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(text)}`
}
