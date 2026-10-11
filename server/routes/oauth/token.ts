import { applyMcpCors, oauthErrorBody } from '~~/server/utils/mcp/http'
import { clientCredentials, isAcceptableResource, OAuthError } from '~~/server/utils/mcp/oauth'
import { authenticateClient, getClient, issueTokens, redeemAuthCode, rotateRefreshToken, siteOrigin } from '~~/server/utils/mcp/oauth-store'

/**
 * Token endpoint: `authorization_code` (PKCE required) and `refresh_token`
 * (rotated on every use). Errors follow RFC 6749 §5.2 as JSON bodies.
 */
export default defineEventHandler(async (event) => {
  if (applyMcpCors(event))
    return null
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    return { error: 'method_not_allowed' }
  }

  const raw = await readBody(event).catch(() => null)
  const form: Record<string, string> = {}
  for (const [key, value] of Object.entries((raw ?? {}) as Record<string, unknown>)) {
    if (typeof value === 'string')
      form[key] = value
  }

  try {
    const { clientId, clientSecret } = clientCredentials(getRequestHeader(event, 'authorization'), form)
    const client = clientId ? await getClient(clientId) : null
    if (!client || !authenticateClient(client, clientSecret))
      throw new OAuthError('invalid_client', 'Unknown client or bad client credentials', 401)

    if (!isAcceptableResource(form.resource, siteOrigin(event)))
      throw new OAuthError('invalid_target', 'This server only issues tokens for its /mcp endpoint')

    let tokens
    if (form.grant_type === 'authorization_code') {
      if (!form.code || !form.code_verifier || !form.redirect_uri)
        throw new OAuthError('invalid_request', 'code, code_verifier and redirect_uri are required')
      const grant = await redeemAuthCode(form.code, { clientId, redirectUri: form.redirect_uri, verifier: form.code_verifier })
      tokens = await issueTokens({ clientId, email: grant.email, uid: grant.uid, resource: grant.resource })
    }
    else if (form.grant_type === 'refresh_token') {
      if (!form.refresh_token)
        throw new OAuthError('invalid_request', 'refresh_token is required')
      tokens = await rotateRefreshToken(form.refresh_token, clientId)
    }
    else {
      throw new OAuthError('unsupported_grant_type', 'Only authorization_code and refresh_token are supported')
    }

    setHeader(event, 'Cache-Control', 'no-store')
    setHeader(event, 'Pragma', 'no-cache')
    return tokens
  }
  catch (err) {
    if (err instanceof OAuthError) {
      if (err.status === 401)
        setHeader(event, 'WWW-Authenticate', 'Basic realm="oauth"')
      return oauthErrorBody(event, err.status, err.code, err.message)
    }
    throw err
  }
})
