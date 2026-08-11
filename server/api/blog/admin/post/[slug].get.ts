import { requireToolAccess } from '~~/server/utils/access'
import { getPost } from '~~/server/utils/blog-store'
import { isValidSlug } from '~~/utils/blog-post'

/** The full record including its markdown — what the editor loads. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  setHeader(event, 'cache-control', 'no-store')

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })

  const post = await getPost(slug)
  if (!post)
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })

  return post
})
