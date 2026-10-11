import { applyMcpCors } from '~~/server/utils/mcp/http'
import { protectedResourceMetadata } from '~~/server/utils/mcp/oauth'
import { siteOrigin } from '~~/server/utils/mcp/oauth-store'

/** RFC 9728 metadata for /mcp — where an MCP client learns how to sign in. */
export default defineEventHandler((event) => {
  if (applyMcpCors(event))
    return null
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return protectedResourceMetadata(siteOrigin(event))
})
