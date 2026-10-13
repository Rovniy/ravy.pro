import { requireToolAccess } from '~~/server/utils/access'
import { pingIndexNow } from '~~/server/utils/indexnow'
import { deleteNote, getNote } from '~~/server/utils/til-store'
import { isValidSlug } from '~~/utils/blog-post'
import { notePingPaths } from '~~/utils/til'

/** Deletes a note. Studio only: the MCP tools can unpublish but never delete. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  const existing = await getNote(slug)
  if (!existing)
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })

  await deleteNote(slug)
  if (existing.published)
    await pingIndexNow(notePingPaths(existing))
  return { ok: true, slug }
})
