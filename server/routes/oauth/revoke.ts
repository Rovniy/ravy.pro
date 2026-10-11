import { applyMcpCors } from '~~/server/utils/mcp/http'
import { clientCredentials } from '~~/server/utils/mcp/oauth'
import { authenticateClient, getClient, revokeToken } from '~~/server/utils/mcp/oauth-store'

/** RFC 7009. Always 200 — whether the token existed is not disclosed. */
export default defineEventHandler(async (event) => {
  if (applyMcpCors(event))
    return null
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'method_not_allowed' }
  }
  const raw = (await readBody(event).catch(() => null) ?? {}) as Record<string, unknown>
  const form = Object.fromEntries(Object.entries(raw).filter(([, v]) => typeof v === 'string')) as Record<string, string>
  const { clientId, clientSecret } = clientCredentials(getRequestHeader(event, 'authorization'), form)
  const client = clientId ? await getClient(clientId) : null
  if (client && authenticateClient(client, clientSecret) && form.token)
    await revokeToken(form.token, clientId)
  setHeader(event, 'Cache-Control', 'no-store')
  return {}
})
