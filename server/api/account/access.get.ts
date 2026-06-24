import { getGrantedTools, isAdminEmail } from '~~/server/utils/access'
import { requireUser } from '~~/server/utils/auth'

// Drives client navigation (Services menu) and in-page gating. Server is still
// the real enforcement point — this is just so the UI knows what to show.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return {
    isAdmin: isAdminEmail(event, user.email),
    tools: await getGrantedTools(event, user.email),
  }
})
