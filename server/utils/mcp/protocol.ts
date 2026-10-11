/**
 * A minimal, stateless MCP server over Streamable HTTP.
 *
 * Every POST carries one JSON-RPC message and gets one JSON response — no SSE
 * stream, no session id. That is a valid Streamable HTTP server (the spec lets
 * the server answer `application/json`), and it is all a handful of request /
 * response tools need. Statelessness matters here: App Hosting runs two
 * instances and a session pinned to one of them would break on the other.
 *
 * Kept free of h3 and Firestore so the dispatch rules are unit-testable.
 */

export const LATEST_PROTOCOL_VERSION = '2025-11-25'
export const SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, '2025-06-18', '2025-03-26', '2024-11-05']

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number | null
  method: string
  params?: Record<string, unknown>
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id: string | number | null
  result?: unknown
  error?: { code: number, message: string, data?: unknown }
}

export const RPC_PARSE_ERROR = -32700
export const RPC_INVALID_REQUEST = -32600
export const RPC_METHOD_NOT_FOUND = -32601
export const RPC_INVALID_PARAMS = -32602
export const RPC_INTERNAL_ERROR = -32603

export interface ToolResult {
  content: Array<{ type: 'text', text: string }>
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

export interface ToolAnnotations {
  title?: string
  readOnlyHint?: boolean
  destructiveHint?: boolean
  idempotentHint?: boolean
  openWorldHint?: boolean
}

export interface ToolDefinition<Ctx> {
  name: string
  title?: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: ToolAnnotations
  handler: (args: Record<string, unknown>, ctx: Ctx) => Promise<ToolResult>
}

/**
 * Thrown by a tool for a problem the model can fix by calling again
 * differently — a bad slug, an unknown tag. It becomes a tool result with
 * `isError: true`, which the model sees, rather than a protocol error, which
 * the client swallows.
 */
export class ToolInputError extends Error {}

export interface ServerInfo {
  name: string
  title?: string
  version: string
  instructions?: string
}

export function textResult(text: string, structured?: Record<string, unknown>): ToolResult {
  return structured ? { content: [{ type: 'text', text }], structuredContent: structured } : { content: [{ type: 'text', text }] }
}

/** Structured result plus the same JSON as text for clients that ignore structuredContent. */
export function jsonResult(value: Record<string, unknown>): ToolResult {
  return textResult(JSON.stringify(value, null, 2), value)
}

function errorResult(message: string): ToolResult {
  return { content: [{ type: 'text', text: message }], isError: true }
}

function rpcError(id: JsonRpcResponse['id'], code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

export function isJsonRpcMessage(value: unknown): value is JsonRpcRequest {
  return !!value && typeof value === 'object' && (value as { jsonrpc?: unknown }).jsonrpc === '2.0'
}

export function negotiateProtocolVersion(requested: unknown): string {
  return typeof requested === 'string' && SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION
}

/**
 * Handles one JSON-RPC message. Returns null for notifications and client
 * responses, which the transport acknowledges with 202 and no body.
 */
export async function dispatch<Ctx>(
  message: unknown,
  tools: ToolDefinition<Ctx>[],
  info: ServerInfo,
  ctx: Ctx,
  onError?: (err: unknown, tool: string) => void,
): Promise<JsonRpcResponse | null> {
  if (!isJsonRpcMessage(message))
    return rpcError(null, RPC_INVALID_REQUEST, 'Invalid JSON-RPC message')

  // A notification (no id) or a response to a server request: nothing to answer.
  if (message.id === undefined || message.id === null || typeof message.method !== 'string')
    return null

  const id = message.id
  const params = (message.params ?? {}) as Record<string, unknown>

  switch (message.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: negotiateProtocolVersion(params.protocolVersion),
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: info.name, title: info.title, version: info.version },
          instructions: info.instructions,
        },
      }

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: tools.map(t => ({
            name: t.name,
            title: t.title,
            description: t.description,
            inputSchema: t.inputSchema,
            annotations: t.annotations,
          })),
        },
      }

    case 'tools/call': {
      const name = params.name
      const tool = tools.find(t => t.name === name)
      if (!tool)
        return rpcError(id, RPC_INVALID_PARAMS, `Unknown tool: ${String(name)}`)
      const args = params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments)
        ? params.arguments as Record<string, unknown>
        : {}
      try {
        return { jsonrpc: '2.0', id, result: await tool.handler(args, ctx) }
      }
      catch (err) {
        if (err instanceof ToolInputError)
          return { jsonrpc: '2.0', id, result: errorResult(err.message) }
        onError?.(err, tool.name)
        return { jsonrpc: '2.0', id, result: errorResult(`${tool.name} failed on the server. Try again; if it keeps failing, report it to the site owner.`) }
      }
    }

    // Declared capabilities are tools only, but a few clients probe these anyway.
    case 'resources/list':
      return { jsonrpc: '2.0', id, result: { resources: [] } }
    case 'prompts/list':
      return { jsonrpc: '2.0', id, result: { prompts: [] } }

    default:
      return rpcError(id, RPC_METHOD_NOT_FOUND, `Method not found: ${message.method}`)
  }
}
