import { requireToolAccess } from '~~/server/utils/access'
import { buildRedirect, isAcceptableResource, isValidCodeChallenge, mcpResourceUrl, redirectUriMatches } from '~~/server/utils/mcp/oauth'
import { createAuthCode, getClient, siteOrigin } from '~~/server/utils/mcp/oauth-store'

/**
 * The consent page's "Allow". The caller is the signed-in site user (Firebase
 * ID token), and must hold the `studio` grant — the MCP tools can do anything
 * the studio can. Returns the URL to send the browser to, carrying a
 * single-use code bound to this client, redirect URI and PKCE challenge.
 */
export default defineEventHandler(async (event) => {
  const user = await requireToolAccess(event, 'studio')
  setHeader(event, 'Cache-Control', 'no-store')

  const body = (await readBody(event).catch(() => null) ?? {}) as Record<string, unknown>
  const clientId = typeof body.client_id === 'string' ? body.client_id : ''
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : ''
  const state = typeof body.state === 'string' ? body.state : undefined
  const origin = siteOrigin(event)

  const client = clientId ? await getClient(clientId) : null
  if (!client || !redirectUriMatches(client.redirectUris, redirectUri))
    throw createError({ statusCode: 400, statusMessage: 'Invalid client or redirect URI' })
  if (!isValidCodeChallenge(body.code_challenge) || body.code_challenge_method !== 'S256')
    throw createError({ statusCode: 400, statusMessage: 'PKCE (S256) is required' })
  if (!isAcceptableResource(body.resource, origin))
    throw createError({ statusCode: 400, statusMessage: 'Invalid resource' })

  const code = await createAuthCode({
    clientId,
    redirectUri,
    codeChallenge: body.code_challenge,
    email: user.email,
    uid: user.uid,
    resource: mcpResourceUrl(origin),
  })

  // `iss` (RFC 9207) lets the client confirm which server answered.
  return { redirect: buildRedirect(redirectUri, { code, state, iss: origin }) }
})
