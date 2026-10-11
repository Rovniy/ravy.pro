import type { ToolDefinition } from '~~/server/utils/mcp/protocol'
import { describe, expect, it, vi } from 'vitest'
import { dispatch, LATEST_PROTOCOL_VERSION, RPC_METHOD_NOT_FOUND, textResult, ToolInputError } from '~~/server/utils/mcp/protocol'

const INFO = { name: 'test', version: '1.0.0', instructions: 'be nice' }

const tools: ToolDefinition<{ who: string }>[] = [
  {
    name: 'echo',
    description: 'echo',
    inputSchema: { type: 'object' },
    handler: async (args, ctx) => textResult(`${ctx.who}:${String(args.text)}`),
  },
  {
    name: 'picky',
    description: 'rejects input',
    inputSchema: { type: 'object' },
    handler: async () => {
      throw new ToolInputError('slug is wrong')
    },
  },
  {
    name: 'broken',
    description: 'crashes',
    inputSchema: { type: 'object' },
    handler: async () => {
      throw new Error('firestore exploded: secret detail')
    },
  },
]

const call = (message: unknown, onError?: (e: unknown, t: string) => void) => dispatch(message, tools, INFO, { who: 'me' }, onError)

describe('mcp dispatch', () => {
  it('echoes a supported protocol version and advertises tools', async () => {
    const res = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26' } })
    expect(res?.result).toMatchObject({
      protocolVersion: '2025-03-26',
      capabilities: { tools: {} },
      serverInfo: { name: 'test' },
      instructions: 'be nice',
    })
  })

  it('answers an unknown protocol version with its latest', async () => {
    const res = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } })
    expect((res?.result as { protocolVersion: string }).protocolVersion).toBe(LATEST_PROTOCOL_VERSION)
  })

  it('returns null for notifications', async () => {
    expect(await call({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull()
  })

  it('lists tools without their handlers', async () => {
    const res = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
    const listed = (res?.result as { tools: Record<string, unknown>[] }).tools
    expect(listed.map(t => t.name)).toEqual(['echo', 'picky', 'broken'])
    expect('handler' in listed[0]!).toBe(false)
  })

  it('calls a tool with arguments and context', async () => {
    const res = await call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'echo', arguments: { text: 'hi' } } })
    expect(res?.result).toEqual({ content: [{ type: 'text', text: 'me:hi' }] })
  })

  // The model has to see input errors to correct itself; a JSON-RPC error
  // would be swallowed by the client.
  it('turns ToolInputError into an isError result', async () => {
    const res = await call({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'picky' } })
    expect(res?.result).toEqual({ content: [{ type: 'text', text: 'slug is wrong' }], isError: true })
  })

  it('hides internal error details and reports them', async () => {
    const onError = vi.fn()
    const res = await call({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'broken' } }, onError)
    const text = (res?.result as { content: { text: string }[] }).content[0]?.text
    expect(text).not.toContain('secret detail')
    expect(onError).toHaveBeenCalledWith(expect.any(Error), 'broken')
  })

  it('rejects unknown methods and malformed messages', async () => {
    expect((await call({ jsonrpc: '2.0', id: 6, method: 'nope' }))?.error?.code).toBe(RPC_METHOD_NOT_FOUND)
    expect((await call({ id: 7, method: 'ping' }))?.error).toBeTruthy()
  })
})
