import { requireToolAccess } from '~~/server/utils/access'
import { listConnectedClients } from '~~/server/utils/mcp/oauth-store'

/** MCP clients currently holding a token for the signed-in user. */
export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'studio')
  setHeader(event, 'Cache-Control', 'no-store')
  return { clients: await listConnectedClients(user.email) }
})
