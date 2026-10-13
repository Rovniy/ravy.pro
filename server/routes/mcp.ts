import type { BlogToolContext } from '~~/server/utils/mcp/blog-tools'
import { hasToolAccess } from '~~/server/utils/access'
import { BLOG_MCP_INSTRUCTIONS, blogTools } from '~~/server/utils/mcp/blog-tools'
import { applyMcpCors } from '~~/server/utils/mcp/http'
import { isAcceptableResource, protectedResourceMetadataUrl } from '~~/server/utils/mcp/oauth'
import { resolveAccessToken, siteOrigin } from '~~/server/utils/mcp/oauth-store'
import { dispatch, RPC_INVALID_REQUEST, RPC_PARSE_ERROR } from '~~/server/utils/mcp/protocol'
import { TIL_MCP_INSTRUCTIONS, tilTools } from '~~/server/utils/mcp/til-tools'
import { reportServerEvent } from '~~/server/utils/report-error'

/**
 * The MCP endpoint (Streamable HTTP, stateless, JSON responses).
 *
 * Authorization is OAuth 2.1: a request without a valid access token gets a
 * 401 whose `WWW-Authenticate` points at the protected-resource metadata, which
 * is how claude.ai and Claude Code discover the sign-in flow on their own. The
 * token's owner must still hold the `studio` grant on every call, so removing
 * the grant in /account cuts a connected client off immediately.
 */

const SERVER_INFO = {
  name: 'ravy-pro-blog',
  title: 'ravy.pro blog',
  version: '1.0.0',
  instructions: `${BLOG_MCP_INSTRUCTIONS}\n\n${TIL_MCP_INSTRUCTIONS}`,
}

/** Blog post tools and TIL note tools, served as one server. */
const TOOLS = [...blogTools, ...tilTools]

/** Legacy JSON-RPC batches are still answered, but only this many at a time. */
const MAX_BATCH = 10

function unauthorized(event: Parameters<typeof applyMcpCors>[0], origin: string, description: string) {
  setResponseStatus(event, 401)
  setHeader(event, 'WWW-Authenticate', `Bearer resource_metadata="${protectedResourceMetadataUrl(origin)}", error="invalid_token", error_description="${description}"`)
  return { error: 'invalid_token', error_description: description }
}

export default defineEventHandler(async (event) => {
  if (applyMcpCors(event))
    return null
  setHeader(event, 'Cache-Control', 'no-store')

  // No server-initiated stream and no sessions: GET and DELETE are not offered.
  if (event.method !== 'POST') {
    setResponseStatus(event, 405)
    setHeader(event, 'Allow', 'POST, OPTIONS')
    return { error: 'method_not_allowed' }
  }

  const origin = siteOrigin(event)
  const token = (getRequestHeader(event, 'authorization') ?? '').match(/^Bearer\s+(\S+)$/i)?.[1] ?? ''
  const owner = token ? await resolveAccessToken(token) : null
  if (!owner || !isAcceptableResource(owner.resource, origin))
    return unauthorized(event, origin, token ? 'The access token is invalid or expired' : 'Authorization required')

  if (!await hasToolAccess(event, owner.email, 'studio')) {
    setResponseStatus(event, 403)
    setHeader(event, 'WWW-Authenticate', `Bearer error="insufficient_scope", error_description="This account no longer has studio access"`)
    return { error: 'insufficient_scope', error_description: 'This account no longer has studio access' }
  }

  // A 10 MB image as base64 is ~13.4 MB; anything bigger is not a blog edit.
  if (Number(getRequestHeader(event, 'content-length') ?? 0) > 16 * 1024 * 1024) {
    setResponseStatus(event, 413)
    return { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }
  }

  let message: unknown
  try {
    message = await readBody(event)
  }
  catch {
    return { jsonrpc: '2.0', id: null, error: { code: RPC_PARSE_ERROR, message: 'Parse error' } }
  }

  // JSON-RPC batches were dropped from MCP in 2025-06-18, but older clients may
  // still send one; answering each element costs nothing.
  const ctx: BlogToolContext = { email: owner.email, origin }
  const onError = (err: unknown, tool: string) =>
    reportServerEvent('ERROR', 'MCP tool failed', { kind: 'mcp-tool', tool, detail: String(err) })

  if (Array.isArray(message)) {
    // Every element runs concurrently, so an uncapped batch is one request
    // fanning out into any number of Firestore writes and image fetches.
    if (message.length > MAX_BATCH)
      return { jsonrpc: '2.0', id: null, error: { code: RPC_INVALID_REQUEST, message: `Batch too large (max ${MAX_BATCH})` } }
    const responses = (await Promise.all(message.map(m => dispatch(m, TOOLS, SERVER_INFO, ctx, onError)))).filter(Boolean)
    if (!responses.length) {
      setResponseStatus(event, 202)
      return null
    }
    return responses
  }

  const response = await dispatch(message, TOOLS, SERVER_INFO, ctx, onError)
  if (!response) {
    setResponseStatus(event, 202)
    return null
  }
  return response
})
