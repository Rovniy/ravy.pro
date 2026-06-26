import { describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, readBody: readBodyMock }
})

const assertRateLimitMock = vi.fn(async () => {})
vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: assertRateLimitMock,
  clientIdentity: vi.fn(() => 'test-ip'),
}))

const reportServerErrorMock = vi.fn()
vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: reportServerErrorMock,
  reportServerEvent: vi.fn(),
}))

function makeEvent() {
  return { node: { req: { headers: { 'user-agent': 'vitest' } }, res: {} } } as never
}

describe('client-error endpoint', () => {
  it('rate-limits, structured-logs as client kind, returns 204', async () => {
    readBodyMock.mockResolvedValueOnce({
      message: 'TypeError: x',
      stack: 'TypeError: x\n  at app',
      source: 'vue',
      url: 'https://ravy.pro/page',
    })
    const { default: handler } = await import('~~/server/api/client-error.post')
    const event = makeEvent()

    const res = await handler(event)

    expect(assertRateLimitMock).toHaveBeenCalled()
    expect(reportServerErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ kind: 'client', source: 'vue', url: 'https://ravy.pro/page' }),
    )
    expect(res).toBeNull()
    expect((event as { node: { res: { statusCode?: number } } }).node.res.statusCode).toBe(204)
  })

  it('survives an oversized payload and still acks 204 (fuzz)', async () => {
    reportServerErrorMock.mockClear()
    readBodyMock.mockResolvedValueOnce({
      message: 'x'.repeat(5000),
      stack: 'y'.repeat(200_000),
      source: 'window',
      url: 'z'.repeat(5000),
    })
    const { default: handler } = await import('~~/server/api/client-error.post')
    const event = makeEvent()

    const res = await handler(event)

    expect(res).toBeNull()
    expect((event as { node: { res: { statusCode?: number } } }).node.res.statusCode).toBe(204)
    expect(reportServerErrorMock).toHaveBeenCalledTimes(1)
  })
})
