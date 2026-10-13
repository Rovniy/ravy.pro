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

/** 10 MB. The studio downscales to 1600px WebP first, so this is the pathological case. */
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

export function mediaUrl(relativePath: string): string {
  return `${MEDIA_URL_PREFIX}/${relativePath}`
}
