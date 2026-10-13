import { requireToolAccess } from '~~/server/utils/access'
import { persistPost } from '~~/server/utils/blog-save'
import { getPost } from '~~/server/utils/blog-store'
import { BlogPostValidationError, isValidSlug, normalizeRecord } from '~~/utils/blog-post'

/**
 * Creates or updates a post.
 *
 * PUT rather than POST because it is idempotent on the slug: the studio's save
 * button does not care whether the post already exists, and neither does this.
 */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')

  const payload = await readBody(event)
  const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Slug must be lowercase letters, digits and single hyphens.' })

  const existing = await getPost(slug)

  // "New post" must not silently overwrite an existing one — a slug collision
  // is easy to hit, since the slug is generated from the title.
  if (existing && payload?.mode === 'create')
    throw createError({ statusCode: 409, statusMessage: 'A post with this slug already exists.' })

  let record
  try {
    record = normalizeRecord(payload, { now: new Date().toISOString(), existing })
  }
  catch (err) {
    if (err instanceof BlogPostValidationError)
      throw createError({ statusCode: 400, statusMessage: err.message })
    throw err
  }

  await persistPost(record, existing)

  return record
})
