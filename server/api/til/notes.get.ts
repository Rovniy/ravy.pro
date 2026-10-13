import { listNotes } from '~~/server/utils/til-store'

/** Published note metadata, newest first: the ⌘K palette, the sitemap and llms. */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  return await listNotes({ publishedOnly: true })
})
