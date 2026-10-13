import { requireToolAccess } from '~~/server/utils/access'
import { listNotes } from '~~/server/utils/til-store'

/** Every note, drafts included, for the studio. Never cached. */
export default defineEventHandler(async (event) => {
  await requireToolAccess(event, 'studio')
  setHeader(event, 'cache-control', 'no-store')
  return await listNotes({ fresh: true })
})
