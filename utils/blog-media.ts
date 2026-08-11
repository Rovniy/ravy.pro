/**
 * Pure helpers for post images stored in Cloud Storage.
 *
 * Shared by the upload route, the serving route and the studio panel, so the
 * three cannot disagree about which types are allowed or how a path is built.
 */

/**
 * Image types the panel may upload.
 *
 * SVG is deliberately absent: these files are served from the site's own
 * origin, and an SVG is a script-execution vector there.
 */
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/avif': 'avif',
  'image/gif': 'gif',
}

/**
 * Types the serving route will hand back.
 *
 * Wider than `ALLOWED_IMAGE_TYPES` on purpose: `svg` and `pdf` exist only
 * because the archive migrated out of `public/blog-content` carried a Google
 * Play badge and a presentation. Uploads still refuse both, so no new file of
 * either type can appear — and the serving route sends an SVG under a locked
 * `Content-Security-Policy`, since a same-origin SVG is otherwise a script.
 */
const EXTENSION_TYPES: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  avif: 'image/avif',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
}

/** Types the browser must never be allowed to sniff or script. */
export const SANDBOXED_TYPES = new Set(['image/svg+xml', 'application/pdf'])

/**
 * Object folder for files that no post references — the presentation PDF linked
 * from /links is the only real case. A single segment, so it still satisfies
 * `isSafeMediaPath`.
 */
export const ORPHAN_MEDIA_FOLDER = 'legacy'

/** 10 MB, matching the `maxBodySize` route rule on the upload endpoint. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** The public URL prefix. Same-origin on purpose — see server/routes/media. */
export const MEDIA_URL_PREFIX = '/media/blog'

/** Storage object prefix inside the bucket. */
export const MEDIA_OBJECT_PREFIX = 'blog'

export function extensionForType(contentType: string): string | null {
  return ALLOWED_IMAGE_TYPES[contentType.toLowerCase().split(';')[0].trim()] ?? null
}

export function typeForExtension(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_TYPES[ext] ?? null
}

/**
 * Rejects anything that could escape the `blog/` prefix or address a different
 * object than the URL says. Only the shapes this code writes are accepted.
 */
export function isSafeMediaPath(path: string): boolean {
  if (!path || path.length > 200)
    return false
  if (path.includes('..') || path.startsWith('/') || path.includes('//'))
    return false
  return /^[a-z0-9][a-z0-9-]*\/[\w-]+\.[a-z0-9]+$/i.test(path)
}

export function mediaObjectName(relativePath: string): string {
  return `${MEDIA_OBJECT_PREFIX}/${relativePath}`
}

/**
 * Asset folders that used to live in `public/` and now live in the bucket.
 * Kept as a list because three things need it: the importer that walks them,
 * the routes that 301 their old URLs, and the docs.
 */
export const LEGACY_MEDIA_DIRS = ['blog-cover', 'blog-content', 'blog-opengraph'] as const

/**
 * Object filename for a file imported out of `public/`.
 *
 * The hash is of the file's *contents*, which is what makes the year-long
 * `immutable` header on the serving route honest and the import idempotent: the
 * same bytes always produce the same name, and different bytes never collide.
 * The basename is kept so the URL still says what the picture is.
 */
export function legacyMediaName(oldPath: string, contentHash: string): string {
  const filename = oldPath.split('/').pop() ?? 'file'
  const dot = filename.lastIndexOf('.')
  const rawBase = dot > 0 ? filename.slice(0, dot) : filename
  const rawExt = dot > 0 ? filename.slice(dot + 1) : 'bin'

  const base = rawBase
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'

  return `${base}-${contentHash}.${ext}`
}

export function mediaUrl(relativePath: string): string {
  return `${MEDIA_URL_PREFIX}/${relativePath}`
}
