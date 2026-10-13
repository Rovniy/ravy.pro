import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getMediaMock = vi.fn()
vi.mock('~~/server/utils/blog-media', () => ({ getMedia: getMediaMock }))

let headers: Record<string, string>
let routePath: string

beforeEach(() => {
  headers = {}
  getMediaMock.mockReset()
  getMediaMock.mockResolvedValue(Buffer.from('bytes'))
  vi.stubGlobal('getRouterParam', () => routePath)
  vi.stubGlobal('setHeader', (_e: unknown, name: string, value: string) => {
    headers[name] = value
  })
  vi.stubGlobal('createError', (o: { statusCode: number }) => Object.assign(new Error('err'), o))
})

async function serve(path: string) {
  routePath = path
  const { default: handler } = await import('~~/server/routes/media/blog/[...path].get')
  return handler({} as never)
}

describe('gET /media/blog/**', () => {
  it('serves an image with its type, a year-long immutable cache and nosniff', async () => {
    expect(await serve('my-post/abc123.webp')).toEqual(Buffer.from('bytes'))
    expect(headers['content-type']).toBe('image/webp')
    expect(headers['cache-control']).toBe('public, max-age=31536000, immutable')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['content-security-policy']).toBeUndefined()
  })

  it('sandboxes SVG and PDF, which can run script when opened from this origin', async () => {
    for (const path of ['legacy/badge-1a2b3c4d5e.svg', 'legacy/slides-1a2b3c4d5e.pdf']) {
      headers = {}
      await serve(path)
      expect(headers['content-security-policy'], path).toMatch(/default-src 'none'.*sandbox/)
      expect(headers['x-content-type-options'], path).toBe('nosniff')
    }
  })

  it('404s traversal, nested and unknown-type paths without touching Storage', async () => {
    for (const path of ['../secret.webp', 'a/../b.webp', 'a/b/c.webp', '%2e%2e/x.webp', 'post/file.exe', 'post/noext']) {
      await expect(serve(path), path).rejects.toMatchObject({ statusCode: 404 })
    }
    expect(getMediaMock).not.toHaveBeenCalled()
  })

  it('404s a missing object', async () => {
    getMediaMock.mockResolvedValue(null)
    await expect(serve('my-post/gone.webp')).rejects.toMatchObject({ statusCode: 404 })
  })
})
