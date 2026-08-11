import { requireToolAccess } from '~~/server/utils/access'
import { renderMarkdown } from '~~/server/utils/blog-render'

/**
 * Renders arbitrary markdown for the editor's preview pane.
 *
 * It goes through the same `renderMarkdown` the live post page uses, so the
 * preview and the published page cannot drift. No cache key: this is called
 * with unsaved text that changes on every keystroke pause.
 */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  setHeader(event, 'cache-control', 'no-store')

  const body = await readBody(event)
  const markdown = typeof body?.markdown === 'string' ? body.markdown : ''
  if (markdown.length > 500_000)
    throw createError({ statusCode: 413, statusMessage: 'Post is too long to preview' })

  return { body: await renderMarkdown(markdown) }
})
