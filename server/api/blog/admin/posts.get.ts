import { requireToolAccess } from '~~/server/utils/access'
import { listMeta } from '~~/server/utils/blog-store'

/** Every post the studio can edit, drafts included. Never cached. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  setHeader(event, 'cache-control', 'no-store')
  // `fresh` skips the 60s index memo so the list reflects a save made a moment
  // ago rather than the copy the public pages are still serving.
  return await listMeta({ fresh: true })
})
