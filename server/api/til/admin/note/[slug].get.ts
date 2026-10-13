import { requireToolAccess } from '~~/server/utils/access'
import { getNote } from '~~/server/utils/til-store'
import { isValidSlug } from '~~/utils/blog-post'
import { noteWarnings } from '~~/utils/til'

/** One note with its markdown, for the editor. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  setHeader(event, 'cache-control', 'no-store')

  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Invalid slug' })
  const note = await getNote(slug)
  if (!note)
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })
  return { ...note, warnings: noteWarnings(note) }
})
