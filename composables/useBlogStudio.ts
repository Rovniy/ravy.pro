import type { BlogPostMeta, BlogPostRecord } from '~/utils/blog-post'
import { useAuth } from '~/composables/useAuth'
import { useAuthedFetch } from '~/composables/useAuthedFetch'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '~/utils/blog-media'

export interface PreviewResponse {
  body: Record<string, unknown>
}

export interface UploadResponse {
  url: string
  bytes: number
}

export interface MigrateResponse {
  ok: boolean
  dryRun: boolean
  wrote: number
  planned?: number
  indexed?: number
  errors: string[]
}

export interface MigrateMediaResponse {
  ok: boolean
  dryRun: boolean
  files: number
  uploads: number
  skipped: number
  postsToRewrite: string[]
  unsupported: string[]
  redirectsAdded?: number
  rewrote?: number
}

/** Longest edge of an uploaded image. Wider than any column the site renders. */
const MAX_IMAGE_EDGE = 1600
const UPLOAD_TYPE = 'image/webp'
const UPLOAD_QUALITY = 0.85

/**
 * Client for the studio's admin routes.
 *
 * Uploads are converted to WebP in the browser first — the panel is meant to
 * be usable from a phone, where the camera roll holds 4 MB HEIC/JPEG files and
 * the connection is whatever it is.
 */
export function useBlogStudio() {
  const { authedFetch } = useAuthedFetch()
  const { getIdToken } = useAuth()

  function listPosts(): Promise<BlogPostMeta[]> {
    return authedFetch<BlogPostMeta[]>('/api/blog/admin/posts')
  }

  function getPost(slug: string): Promise<BlogPostRecord> {
    return authedFetch<BlogPostRecord>(`/api/blog/admin/post/${slug}`)
  }

  function savePost(record: Partial<BlogPostRecord> & { slug: string }, mode: 'create' | 'update'): Promise<BlogPostRecord> {
    return authedFetch<BlogPostRecord>('/api/blog/admin/post', {
      method: 'PUT',
      body: JSON.stringify({ ...record, mode }),
    })
  }

  function deletePost(slug: string): Promise<{ ok: boolean }> {
    return authedFetch<{ ok: boolean }>(`/api/blog/admin/post/${slug}`, { method: 'DELETE' })
  }

  function preview(markdown: string): Promise<PreviewResponse> {
    return authedFetch<PreviewResponse>('/api/blog/admin/preview', {
      method: 'POST',
      body: JSON.stringify({ markdown }),
    })
  }

  function reindex(): Promise<{ ok: boolean, count: number }> {
    return authedFetch<{ ok: boolean, count: number }>('/api/blog/admin/reindex', { method: 'POST' })
  }

  /** Dev-only one-off import of content/blogs/*.md. The route 404s in production. */
  function migrate(dryRun: boolean): Promise<MigrateResponse> {
    return authedFetch<MigrateResponse>('/api/blog/admin/migrate', {
      method: 'POST',
      body: JSON.stringify({ dryRun }),
    })
  }

  /** Dev-only one-off import of the public/blog-* image folders into Storage. */
  function migrateMedia(dryRun: boolean): Promise<MigrateMediaResponse> {
    return authedFetch<MigrateMediaResponse>('/api/blog/admin/migrate-media', {
      method: 'POST',
      body: JSON.stringify({ dryRun }),
    })
  }

  /**
   * Downscale + re-encode to WebP on the client.
   *
   * Reuses the same `createImageBitmap` → `canvas.toBlob` path as the Image
   * Converter tool. Returns the original file untouched if the browser can't
   * decode it, so an unusual format still reaches the server-side type check
   * rather than failing silently here.
   */
  async function toUploadBlob(file: File): Promise<{ blob: Blob, type: string }> {
    if (!(file.type in ALLOWED_IMAGE_TYPES) && !file.type.startsWith('image/'))
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}`)

    // Animated GIFs only decode to their first frame on a canvas, so they are
    // passed through as-is rather than silently losing the animation.
    if (file.type === 'image/gif')
      return { blob: file, type: file.type }

    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    }
    catch {
      return { blob: file, type: file.type }
    }

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return { blob: file, type: file.type }
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, UPLOAD_TYPE, UPLOAD_QUALITY))

    if (!blob)
      return { blob: file, type: file.type }
    return { blob, type: UPLOAD_TYPE }
  }

  async function uploadImage(file: File, slug: string): Promise<UploadResponse> {
    const { blob, type } = await toUploadBlob(file)
    if (blob.size > MAX_IMAGE_BYTES)
      throw new Error('Image is larger than 10 MB even after conversion')

    const form = new FormData()
    form.append('slug', slug)
    form.append('file', blob, `upload.${ALLOWED_IMAGE_TYPES[type] ?? 'bin'}`)

    // Not `authedFetch`: it sets Content-Type: application/json on any body,
    // which would strip the multipart boundary.
    const token = await getIdToken()
    if (!token)
      throw new Error('Not authenticated')

    const res = await fetch('/api/blog/admin/media', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok)
      throw new Error(await res.text().catch(() => '') || `Upload failed: ${res.status}`)
    return await res.json() as UploadResponse
  }

  return { listPosts, getPost, savePost, deletePost, preview, reindex, migrate, migrateMedia, uploadImage }
}
