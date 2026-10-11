import { applyMcpCors, oauthErrorBody } from '~~/server/utils/mcp/http'
import { OAuthError, parseRegistration } from '~~/server/utils/mcp/oauth'
import { registerClient } from '~~/server/utils/mcp/oauth-store'
import { assertRateLimit, clientIdentity } from '~~/server/utils/rate-limit'

/**
 * RFC 7591 dynamic client registration. Open by design — that is how claude.ai
 * and Claude Code onboard without a pre-shared client id. Registering grants
 * nothing: a client still needs a signed-in studio user to approve it on the
 * consent page, which shows the client's name and redirect host.
 */
export default defineEventHandler(async (event) => {
  if (applyMcpCors(event))
    return null
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'method_not_allowed' }
  }

  await assertRateLimit({ bucket: 'mcp-register', identity: clientIdentity(event), limit: 20, windowMs: 60 * 60 * 1000 })

  let reg
  try {
    reg = parseRegistration(await readBody(event).catch(() => null))
  }
  catch (err) {
    if (err instanceof OAuthError)
      return oauthErrorBody(event, 400, err.code, err.message)
    throw err
  }

  const { clientId, clientSecret, issuedAt } = await registerClient(reg)
  setResponseStatus(event, 201)
  setHeader(event, 'Cache-Control', 'no-store')
  return {
    client_id: clientId,
    ...(clientSecret ? { client_secret: clientSecret, client_secret_expires_at: 0 } : {}),
    client_id_issued_at: issuedAt,
    client_name: reg.clientName,
    redirect_uris: reg.redirectUris,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: reg.authMethod,
  }
})
