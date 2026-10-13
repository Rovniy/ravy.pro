import type { TilNoteMeta } from '~~/utils/til'
import { TIL_TOPIC_IDS } from '~~/data/til'
import { renderMarkdown } from '~~/server/utils/blog-render'
import { getNotes, listNotes } from '~~/server/utils/til-store'
import { topicCounts } from '~~/utils/til'

const MAX_LIMIT = 50

/**
 * Notes with their rendered bodies, for /til and the topic hubs. Notes are
 * short, so a feed shows them in full, the way a reader of a TIL page expects.
 *
 * Returns `notes` (the newest `limit`, rendered), `archive` (the metadata of
 * every other note in scope, for the plain list under the feed) and `counts`
 * per topic.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const topic = typeof query.topic === 'string' ? query.topic : ''
  if (topic && !TIL_TOPIC_IDS.includes(topic))
    throw createError({ statusCode: 404, statusMessage: 'Unknown topic' })
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || 20))

  const published = await listNotes({ publishedOnly: true })
  const scoped = topic ? published.filter(n => n.topics.includes(topic)) : published

  const records = await getNotes(scoped.slice(0, limit).map(n => n.slug))
  const notes = await Promise.all(records
    .filter(r => r.published)
    .map(async ({ markdown, ...meta }) => ({ ...meta, body: await renderMarkdown(markdown) })))

  const counts = topicCounts(published)

  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  return {
    notes,
    archive: scoped.slice(limit) as TilNoteMeta[],
    total: scoped.length,
    counts,
  }
})
