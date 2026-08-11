import { requireToolAccess } from '~~/server/utils/access'
import { rebuildIndex } from '~~/server/utils/blog-store'

/**
 * Rebuilds `blog_index/current` from the post collection.
 *
 * Every save does this already; this route exists for the case where the two
 * drift anyway — a write that failed halfway, or a document edited straight in
 * the Firestore console.
 */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  const posts = await rebuildIndex()
  return { ok: true, count: posts.length }
})
