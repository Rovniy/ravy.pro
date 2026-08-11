import { renderMarkdown } from '~~/server/utils/blog-render'
import { getPost } from '~~/server/utils/blog-store'
import { isValidSlug, toMeta } from '~~/utils/blog-post'

/**
 * A single published post: metadata plus its rendered body.
 *
 * The raw markdown is deliberately not in the response — it would double the
 * page payload for something no reader needs. Drafts 404 here; the studio has
 * its own authenticated preview.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  const post = await getPost(slug)
  if (!post || !post.published)
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')

  const body = await renderMarkdown(post.markdown)

  return { ...toMeta(post), body }
})
