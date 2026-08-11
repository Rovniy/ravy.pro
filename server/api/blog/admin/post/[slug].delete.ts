import { requireToolAccess } from '~~/server/utils/access'
import { clearRenderCache } from '~~/server/utils/blog-render'
import { deletePost, getPost } from '~~/server/utils/blog-store'
import { isValidSlug } from '~~/utils/blog-post'

/**
 * Deletes a post.
 *
 * Its uploaded images are deliberately left in the bucket: they cost cents,
 * and a delete triggered by a mistyped URL should be recoverable by pasting
 * the markdown back.
 */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })

  const existing = await getPost(slug)
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  await deletePost(slug)
  clearRenderCache()

  return { ok: true, slug }
})
