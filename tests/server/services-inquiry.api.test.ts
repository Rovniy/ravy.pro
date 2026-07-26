import { beforeEach, describe, expect, it, vi } from 'vitest'

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

const sendMock = vi.fn(async () => {})
vi.mock('~~/server/utils/email', () => ({
  sendServiceInquiryEmail: sendMock,
}))

const reportServerErrorMock = vi.fn()
vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: reportServerErrorMock,
  reportServerEvent: vi.fn(),
}))

const valid = {
  service: 'mentorship',
  name: 'Anna',
  contact: '@anna',
  message: 'Where I am right now',
  consent: true,
  page: '/services/mentorship',
}

async function handle(body: unknown) {
  readBodyMock.mockResolvedValueOnce(body)
  const { default: handler } = await import('~~/server/api/services/inquiry.post')
  return handler({} as never)
}

describe('services inquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sendMock.mockImplementation(async () => {})
    assertRateLimitMock.mockImplementation(async () => {})
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: 're_x' }))
  })

  it('sends a valid inquiry with the resolved service label', async () => {
    await expect(handle(valid)).resolves.toEqual({ ok: true })

    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'contact@ravy.pro',
      apiKey: 're_x',
      serviceLabel: 'Mentorship & job placement in IT',
      inquiry: expect.objectContaining({ name: 'Anna', contact: '@anna', page: '/services/mentorship' }),
    }))
  })

  it('reports success and sends nothing when the honeypot is filled', async () => {
    await expect(handle({ ...valid, company: 'Acme Inc' })).resolves.toEqual({ ok: true })
    expect(sendMock).not.toHaveBeenCalled()
    expect(reportServerErrorMock).not.toHaveBeenCalled()
  })

  it('rejects an unknown service without sending', async () => {
    await expect(handle({ ...valid, service: 'nope' })).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a missing name without sending', async () => {
    await expect(handle({ ...valid, name: '' })).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects a submission without consent', async () => {
    await expect(handle({ ...valid, consent: false })).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('errors when the API key is not configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ resendApiKey: '' }))
    await expect(handle(valid)).rejects.toMatchObject({ statusCode: 500 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('surfaces a send failure as a 502 and reports it', async () => {
    sendMock.mockRejectedValueOnce(new Error('Resend send failed (422)'))
    await expect(handle(valid)).rejects.toMatchObject({ statusCode: 502 })
    expect(reportServerErrorMock).toHaveBeenCalledWith(expect.anything(), { kind: 'service-inquiry' })
  })

  it('throttles per IP on its own bucket', async () => {
    await handle(valid)
    expect(assertRateLimitMock).toHaveBeenCalledWith(expect.objectContaining({
      bucket: 'service-inquiry',
      identity: 'test-ip',
      limit: 3,
    }))
  })

  it('propagates a rate-limit rejection', async () => {
    assertRateLimitMock.mockRejectedValueOnce(Object.assign(new Error('nope'), { statusCode: 429 }))
    await expect(handle(valid)).rejects.toMatchObject({ statusCode: 429 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects absurdly long garbage without sending (fuzz)', async () => {
    await expect(handle({
      ...valid,
      name: 'a'.repeat(10_000),
      message: 'b'.repeat(20_000),
    })).rejects.toMatchObject({ statusCode: 400 })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('truncates a long-but-otherwise-valid message rather than rejecting it', async () => {
    await expect(handle({ ...valid, message: 'b'.repeat(20_000) })).resolves.toEqual({ ok: true })
    const arg = sendMock.mock.calls[0]![0] as unknown as { inquiry: { message: string } }
    expect(arg.inquiry.message).toHaveLength(2000)
  })
})
