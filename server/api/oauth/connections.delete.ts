import { requireToolAccess } from '~~/server/utils/access'
import { revokeAllForEmail } from '~~/server/utils/mcp/oauth-store'

/**
 * Disconnects every MCP client of the signed-in user at once. Access tokens
 * die with their documents, so this takes effect on the very next call.
 */
export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'studio')
  return { revoked: await revokeAllForEmail(user.email) }
})
