import { renderMarkdown } from '~~/server/utils/blog-render'
import { getNote, listNotes } from '~~/server/utils/til-store'
import { isValidSlug } from '~~/utils/blog-post'
import { publicVideo, relatedNotes, toNoteMeta } from '~~/utils/til'

/**
 * One published note with its rendered body, up to five related notes, and its
 * YouTube Short once that is public (`video`, null otherwise). Drafts 404.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidSlug(slug))
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })

  const note = await getNote(slug)
  if (!note || !note.published)
    throw createError({ statusCode: 404, statusMessage: 'Note not found' })

  const all = await listNotes({ publishedOnly: true })
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  return {
    ...toNoteMeta(note),
    body: await renderMarkdown(note.markdown),
    related: relatedNotes(note, all, 5),
    video: publicVideo(note),
  }
})
