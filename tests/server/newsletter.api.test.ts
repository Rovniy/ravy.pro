import { describe, expect, it, vi } from 'vitest'

const readBodyMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, readBody: readBodyMock }
})

vi.mock('~~/server/utils/rate-limit', () => ({
  assertRateLimit: vi.fn(async () => {}),
  clientIdentity: vi.fn(() => 'test-ip'),
}))

const addContactMock = vi.fn(async () => ({ status: 'subscribed' as const }))
vi.mock('~~/server/utils/newsletter', () => ({
  addNewsletterContact: addContactMock,
}))

vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: vi.fn(),
  reportServerEvent: vi.fn(),
}))

describe('newsletter subscribe', () => {
  it('subscribes a valid email (normalized) and forwards the optional segment', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 're_x', resendSegmentId: 'seg_1' }))
    readBodyMock.mockResolvedValueOnce({ email: 'User@Example.com' })
    const { default: handler } = await import('~~/server/api/newsletter/subscribe.post')

    const res = await handler({} as never)

    expect(res).toEqual({ ok: true, status: 'subscribed' })
    expect(addContactMock).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com', segmentId: 'seg_1' }))
  })

  it('works with just the API key (no segment configured)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 're_x', resendSegmentId: '' }))
    readBodyMock.mockResolvedValueOnce({ email: 'a@b.co' })
    const { default: handler } = await import('~~/server/api/newsletter/subscribe.post')

    const res = await handler({} as never)

    expect(res).toEqual({ ok: true, status: 'subscribed' })
    expect(addContactMock).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.co', segmentId: undefined }))
  })

  it('rejects an invalid email', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 're_x', resendSegmentId: 'seg_1' }))
    readBodyMock.mockResolvedValueOnce({ email: 'not-an-email' })
    const { default: handler } = await import('~~/server/api/newsletter/subscribe.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('errors when the API key is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '', resendSegmentId: '' }))
    readBodyMock.mockResolvedValueOnce({ email: 'user@example.com' })
    const { default: handler } = await import('~~/server/api/newsletter/subscribe.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 500 })
  })

  it('rejects an absurdly long garbage email without calling Resend (fuzz)', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 're_x', resendSegmentId: '' }))
    readBodyMock.mockResolvedValueOnce({ email: 'a'.repeat(10000) })
    addContactMock.mockClear()
    const { default: handler } = await import('~~/server/api/newsletter/subscribe.post')
    await expect(handler({} as never)).rejects.toMatchObject({ statusCode: 400 })
    expect(addContactMock).not.toHaveBeenCalled()
  })
})
