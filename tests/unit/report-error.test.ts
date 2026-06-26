import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reportServerError, reportServerEvent } from '../../server/utils/report-error'

describe('report-error (production JSON output)', () => {
  beforeEach(() => vi.stubEnv('NODE_ENV', 'production'))
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('reportServerError emits a grouped ERROR with stack + context', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportServerError(new Error('boom'), { kind: 'contract-scan', status: 500 })

    expect(spy).toHaveBeenCalledTimes(1)
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(parsed.severity).toBe('ERROR')
    expect(parsed['@type']).toContain('ReportedErrorEvent')
    expect(parsed.message).toContain('boom')
    expect(parsed.context.kind).toBe('contract-scan')
    expect(parsed.serviceContext.service).toBeTruthy()
  })

  it('reportServerError coerces non-Error input', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    reportServerError('just a string', { kind: 'x' })
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(parsed.severity).toBe('ERROR')
    expect(parsed.context.kind).toBe('x')
  })

  it('reportServerEvent emits the given severity + message', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    reportServerEvent('WARNING', 'rate limit hiccup', { kind: 'rate-limit' })
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string)
    expect(parsed.severity).toBe('WARNING')
    expect(parsed.message).toBe('rate limit hiccup')
    expect(parsed.context.kind).toBe('rate-limit')
  })
})
