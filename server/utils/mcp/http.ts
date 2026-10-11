import type { H3Event } from 'h3'
import { setResponseHeaders, setResponseStatus } from 'h3'

/**
 * CORS for the machine-facing MCP/OAuth endpoints. claude.ai and Claude Code
 * call them server-side, but browser-based MCP clients (the MCP Inspector, web
 * agents) need these headers to read the responses. Every one of these routes
 * is authenticated by a bearer token or carries no secret at all, never by a
 * cookie, so a wildcard origin grants nothing a cross-site page could abuse.
 *
 * Returns true when the request was a preflight and has been answered.
 */
export function applyMcpCors(event: H3Event): boolean {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
    'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id, Mcp-Protocol-Version',
    'Access-Control-Max-Age': '86400',
  })
  if (event.method === 'OPTIONS') {
    setResponseStatus(event, 204)
    return true
  }
  return false
}

/** OAuth error responses (RFC 6749 §5.2) are JSON bodies, not h3 errors. */
export function oauthErrorBody(event: H3Event, status: number, error: string, description: string) {
  setResponseStatus(event, status)
  setResponseHeaders(event, { 'Cache-Control': 'no-store' })
  return { error, error_description: description }
}
