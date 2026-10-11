import { isAcceptableResource, isValidCodeChallenge, redirectUriMatches } from '~~/server/utils/mcp/oauth'
import { getClient, siteOrigin } from '~~/server/utils/mcp/oauth-store'

/**
 * Validates an authorization request before the consent page shows anything.
 *
 * Only after this passes may the page send the browser back to `redirect_uri`
 * — with a code or with `access_denied`. An unvalidated redirect_uri would make
 * /oauth/authorize an open redirector, so a failure here is shown on the page
 * and never redirected (RFC 6749 §4.1.2.1).
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const q = getQuery(event)
  const clientId = typeof q.client_id === 'string' ? q.client_id : ''
  const redirectUri = typeof q.redirect_uri === 'string' ? q.redirect_uri : ''

  const client = clientId ? await getClient(clientId) : null
  if (!client)
    return { ok: false, error: 'Unknown client. Remove the connector and add it again.' }
  if (!redirectUri || !redirectUriMatches(client.redirectUris, redirectUri))
    return { ok: false, error: 'The redirect address does not match the one this client registered.' }

  // From here on errors can go back to the client, but the page needs to know.
  if (q.response_type !== 'code')
    return { ok: false, redirectable: true, error: 'unsupported_response_type' }
  if (q.code_challenge_method !== 'S256' || !isValidCodeChallenge(q.code_challenge))
    return { ok: false, redirectable: true, error: 'invalid_request' }
  if (!isAcceptableResource(q.resource, siteOrigin(event)))
    return { ok: false, redirectable: true, error: 'invalid_target' }

  return {
    ok: true,
    clientName: client.clientName,
    redirectHost: new URL(redirectUri).host,
    issuer: siteOrigin(event),
  }
})
