import { applyMcpCors } from '~~/server/utils/mcp/http'
import { authorizationServerMetadata } from '~~/server/utils/mcp/oauth'
import { siteOrigin } from '~~/server/utils/mcp/oauth-store'

/** RFC 8414 metadata. The site is its own authorization server for /mcp. */
export default defineEventHandler((event) => {
  if (applyMcpCors(event))
    return null
  setHeader(event, 'Cache-Control', 'public, max-age=3600')
  return authorizationServerMetadata(siteOrigin(event))
})
