import { describe, expect, it, vi } from 'vitest'

const sendRedirectMock = vi.fn((_e, url) => `redirect:${url}`)
const getRouterParamMock = vi.fn(() => 'abc123')
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return {
    ...mod,
    sendRedirect: sendRedirectMock,
    getRouterParam: getRouterParamMock,
  }
})

const getMock = vi.fn()
const updateMock = vi.fn(() => Promise.resolve())
vi.mock('~~/server/utils/firebase-admin', () => ({
  SHORTLINKS_COLLECTION: 'shortlinks',
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: getMock,
        update: updateMock,
      })),
    })),
  })),
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    increment: vi.fn(() => 1),
    serverTimestamp: vi.fn(() => 'ts'),
  },
}))

describe('gET /s/[code]', () => {
  it('redirects to url and updates clicks', async () => {
    getRouterParamMock.mockReturnValueOnce('abc123')
    getMock.mockResolvedValueOnce({
      exists: true,
      get: (k: string) => (k === 'url' ? 'https://example.com' : undefined),
    })
    const { default: handler } = await import('~~/server/routes/s/[code].get')
    const out = await handler({} as never)
    expect(out).toBe('redirect:https://example.com')
    expect(updateMock).toHaveBeenCalled()
  })

  it('redirects home for an unknown code (no open data leak)', async () => {
    getRouterParamMock.mockReturnValueOnce('doesnotexist')
    getMock.mockResolvedValueOnce({ exists: false, get: () => undefined })
    const { default: handler } = await import('~~/server/routes/s/[code].get')
    expect(await handler({} as never)).toBe('redirect:/')
  })

  it('rejects an invalid / oversized code before touching the DB (fuzz)', async () => {
    getRouterParamMock.mockReturnValueOnce(`${'x'.repeat(5000)}/../../etc/passwd`)
    getMock.mockClear()
    const { default: handler } = await import('~~/server/routes/s/[code].get')
    expect(await handler({} as never)).toBe('redirect:/')
    expect(getMock).not.toHaveBeenCalled()
  })
})
