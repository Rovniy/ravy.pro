import { requireToolAccess } from '~~/server/utils/access'
import { persistNote } from '~~/server/utils/til-save'
import { getNote } from '~~/server/utils/til-store'
import { isValidSlug } from '~~/utils/blog-post'
import { normalizeNote, noteWarnings, TilNoteValidationError } from '~~/utils/til'

/** Creates or updates a note; idempotent on the slug, like the post route. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')

  const payload = await readBody(event)
  const slug = typeof payload?.slug === 'string' ? payload.slug.trim() : ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 400, statusMessage: 'Slug must be lowercase letters, digits and single hyphens.' })

  const existing = await getNote(slug)
  if (existing && payload?.mode === 'create')
    throw createError({ statusCode: 409, statusMessage: 'A note with this slug already exists.' })

  let note
  try {
    note = normalizeNote(payload, { now: new Date().toISOString(), existing })
  }
  catch (err) {
    if (err instanceof TilNoteValidationError)
      throw createError({ statusCode: 400, statusMessage: err.message })
    throw err
  }

  await persistNote(note, existing)
  return { ...note, warnings: noteWarnings(note) }
})
