/**
 * Pure helpers for blog posts stored in Firestore.
 *
 * Everything here is free of Firebase, Nuxt and h3 so it can be unit-tested
 * directly. The Firestore access lives in `server/utils/blog-store.ts` and the
 * markdown rendering in `server/utils/blog-render.ts`.
 */

import { findEmbedProblems } from './blog-embeds'

/** Everything about a post except its body. This is what list views need. */
export interface BlogPostMeta {
  /**
   * The public URL. Stored rather than derived from the slug: the posts
   * migrated out of `content/blogs/*.md` must keep the exact paths @nuxt/content
   * generated for them, and a re-derivation rule is one refactor away from
   * quietly moving 30 URLs.
   */
  path: string
  slug: string
  title: string
  description: string
  image: string
  ogImage: string
  alt: string
  tags: string[]
  published: boolean
  trending: boolean
  noindex: boolean
  /** Overrides the tags for `article:tag`. Empty means "use the tags". */
  theme: string
  /** OG locale, e.g. `ru_RU`. Also drives `<html lang>` on the post. */
  locale: string
  createdAt: string
  lastUpdated: string
}

/** A full post: metadata plus the raw markdown body (no frontmatter). */
export interface BlogPostRecord extends BlogPostMeta {
  markdown: string
}

export const DEFAULT_LOCALE = 'en_US'
export const FALLBACK_IMAGE = '/not-found.png'

/** Lowercase, hyphenated, ASCII. Matches the slugs @nuxt/content produced. */
const SLUG_RX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && slug.length > 0 && slug.length <= 120 && SLUG_RX.test(slug)
}

/**
 * Title → slug. Deliberately ASCII-only: a Cyrillic title would otherwise
 * produce a percent-encoded URL that is unreadable everywhere it gets pasted.
 * When the result is empty the caller has to supply a slug by hand.
 */
export function slugify(title: string): string {
  return String(title ?? '')
    .normalize('NFKD')
    // Strip combining marks so "é" becomes "e" rather than disappearing.
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '')
}

export function postPath(slug: string): string {
  return `/blogs/${slug}`
}

/** `/blogs/foo` → `foo`. Returns '' for anything that is not a post path. */
export function slugFromPath(path: string): string {
  const match = /^\/blogs\/([^/]+)\/?$/.exec(String(path ?? ''))
  return match ? match[1] : ''
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function bool(value: unknown): boolean {
  return value === true
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value))
    return []
  return [...new Set(value.filter((v): v is string => typeof v === 'string' && !!v.trim()).map(v => v.trim()))]
}

/**
 * Slugs the studio uses for its own routes. A post claiming one of these would
 * be unreachable from the panel, so it is rejected at save time rather than
 * discovered later.
 */
export const RESERVED_SLUGS = new Set(['new'])

export class BlogPostValidationError extends Error {}

export interface NormalizeOptions {
  /** ISO timestamp used for missing `createdAt` / every `lastUpdated`. */
  now: string
  /** Existing record being updated, if any — supplies `createdAt` and `path`. */
  existing?: BlogPostRecord | null
}

/**
 * Validate and normalise a payload coming from the studio panel (or the
 * migration) into a storable record. Throws `BlogPostValidationError` with a
 * user-facing message; the API routes turn that into a 400.
 */
export function normalizeRecord(input: unknown, opts: NormalizeOptions): BlogPostRecord {
  const raw = (input ?? {}) as Record<string, unknown>
  const existing = opts.existing ?? null

  const slug = str(raw.slug) || existing?.slug || ''
  if (!isValidSlug(slug))
    throw new BlogPostValidationError('Slug must be lowercase letters, digits and single hyphens.')
  if (RESERVED_SLUGS.has(slug))
    throw new BlogPostValidationError(`"${slug}" is reserved — pick another slug.`)

  const title = str(raw.title)
  if (!title)
    throw new BlogPostValidationError('Title is required.')

  const description = str(raw.description)
  if (!description)
    throw new BlogPostValidationError('Description is required.')

  const image = str(raw.image)
  if (!image)
    throw new BlogPostValidationError('Cover image is required.')

  const tags = stringList(raw.tags)
  if (!tags.length)
    throw new BlogPostValidationError('At least one tag is required.')

  const markdown = typeof raw.markdown === 'string' ? raw.markdown : ''
  if (!markdown.trim())
    throw new BlogPostValidationError('Post body is empty.')

  const embedProblems = findEmbedProblems(markdown)
  if (embedProblems.length)
    throw new BlogPostValidationError(embedProblems.join(' | '))

  const createdAt = str(raw.createdAt) || existing?.createdAt || opts.now

  // `article:modified_time` earlier than `article:published_time` has shipped
  // before. A post dated in the future would produce exactly that again.
  if (createdAt && createdAt > opts.now)
    throw new BlogPostValidationError('createdAt is in the future — lastUpdated would end up before it.')

  return {
    // An existing post never changes its path, even if the slug field is
    // re-sent: the URL is the one thing that must survive every edit.
    path: existing?.path || postPath(slug),
    slug,
    title,
    description,
    image,
    ogImage: str(raw.ogImage) || image,
    alt: str(raw.alt) || description,
    tags,
    published: bool(raw.published),
    trending: bool(raw.trending),
    noindex: bool(raw.noindex),
    theme: str(raw.theme),
    locale: str(raw.locale, DEFAULT_LOCALE),
    createdAt,
    lastUpdated: opts.now,
    markdown,
  }
}

/**
 * Coerce a Firestore document into a record. Unlike `normalizeRecord` this
 * never throws — a doc written by an older version of the panel should render,
 * not 500 the blog.
 */
export function recordFromDoc(data: Record<string, unknown> | undefined, slug: string): BlogPostRecord | null {
  if (!data)
    return null
  const title = str(data.title)
  if (!title)
    return null
  const image = str(data.image, FALLBACK_IMAGE)
  const description = str(data.description)
  return {
    path: str(data.path) || postPath(slug),
    slug: str(data.slug, slug),
    title,
    description,
    image,
    ogImage: str(data.ogImage, image),
    alt: str(data.alt) || description || title,
    tags: stringList(data.tags),
    published: bool(data.published),
    trending: bool(data.trending),
    noindex: bool(data.noindex),
    theme: str(data.theme),
    locale: str(data.locale, DEFAULT_LOCALE),
    createdAt: str(data.createdAt),
    lastUpdated: str(data.lastUpdated) || str(data.createdAt),
    markdown: typeof data.markdown === 'string' ? data.markdown : '',
  }
}

/** Strip the body — what goes into the index doc and every list response. */
export function toMeta(record: BlogPostRecord): BlogPostMeta {
  const { markdown: _markdown, ...meta } = record
  return meta
}

/** Newest first, by `createdAt`. Undated posts sort last, then by title. */
export function sortByCreatedDesc<T extends { createdAt: string, title: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => {
    if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt)
      return a.createdAt < b.createdAt ? 1 : -1
    if (!a.createdAt !== !b.createdAt)
      return a.createdAt ? -1 : 1
    return a.title.localeCompare(b.title)
  })
}

export interface BlogCardData {
  path: string
  title: string
  description: string
  image: string
  ogImage: string
  alt: string
  tags: string[]
  createdAt: string
  lastUpdated: string
  published: boolean
  trending: boolean
}

/**
 * The shape `<BlogCard>` wants. The three list views (blogs index, category
 * page, home "Recent Posts") each carried their own copy of this defaulting.
 */
export function toCardData(post: Partial<BlogPostMeta> & { path?: string }): BlogCardData {
  const description = post.description || 'no-description available'
  const image = post.image || FALLBACK_IMAGE
  return {
    path: post.path || '',
    title: post.title || 'no-title available',
    description,
    image,
    ogImage: post.ogImage || image,
    alt: post.alt || description,
    tags: post.tags || [],
    createdAt: post.createdAt || '',
    lastUpdated: post.lastUpdated || '',
    published: post.published ?? false,
    trending: post.trending ?? false,
  }
}
