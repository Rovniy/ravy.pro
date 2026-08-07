import { beforeEach, describe, expect, it, vi } from 'vitest'

const setResponseHeaderMock = vi.fn()
vi.mock('h3', async (importOriginal) => {
  const mod = await importOriginal<typeof import('h3')>()
  return { ...mod, setResponseHeader: setResponseHeaderMock }
})

vi.mock('~~/server/utils/report-error', () => ({
  reportServerError: vi.fn(),
  reportServerEvent: vi.fn(),
}))

const payload = {
  tag_name: '0.1.0',
  html_url: 'https://github.com/Rovniy/windows-translater/releases/tag/0.1.0',
  published_at: '2026-08-06T17:24:34Z',
  assets: [
    { name: 'XPLOIT-Translator_0.1.0_x64-setup.exe', size: 2_535_903, browser_download_url: 'https://example.com/setup.exe' },
    { name: 'XPLOIT-Translator_0.1.0_x64-portable.exe', size: 8_955_904, browser_download_url: 'https://example.com/portable.exe' },
  ],
}

const fetchMock = vi.fn()

// The handler memoises at module scope, so every test starts from a fresh copy.
async function loadHandler() {
  vi.resetModules()
  return (await import('~~/server/api/xploit-translator/release.get')).default
}

beforeEach(() => {
  fetchMock.mockReset()
  setResponseHeaderMock.mockClear()
  vi.stubGlobal('fetch', fetchMock)
})

function ok() {
  return { ok: true, status: 200, json: async () => payload }
}

describe('gET /api/xploit-translator/release', () => {
  it('returns the parsed release and a cacheable response', async () => {
    fetchMock.mockResolvedValue(ok())
    const handler = await loadHandler()

    const res = await handler({} as never) as any

    expect(res.ok).toBe(true)
    expect(res.release.version).toBe('0.1.0')
    expect(res.release.installer.url).toBe('https://example.com/setup.exe')
    expect(res.release.portable.size).toBe(8_955_904)
    expect(res.release.checksums).toBeNull()
    expect(setResponseHeaderMock).toHaveBeenCalledWith(
      expect.anything(),
      'Cache-Control',
      expect.stringContaining('s-maxage=900'),
    )
  })

  it('serves the memo instead of calling GitHub again', async () => {
    fetchMock.mockResolvedValue(ok())
    const handler = await loadHandler()

    await handler({} as never)
    await handler({} as never)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to ok:false rather than throwing when GitHub is down', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })
    const handler = await loadHandler()

    const res = await handler({} as never) as any

    expect(res).toEqual({ ok: false, release: null })
  })

  it('treats an unrecognisable payload as a failure', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ message: 'Not Found' }) })
    const handler = await loadHandler()

    expect(await handler({} as never)).toEqual({ ok: false, release: null })
  })

  it('serves the last good release when a later refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(ok())
    const handler = await loadHandler()
    await handler({} as never)

    // Push the memo past its TTL, then fail the refresh.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 20 * 60 * 1000)
    fetchMock.mockRejectedValueOnce(new Error('network down'))

    const res = await handler({} as never) as any

    expect(res.ok).toBe(true)
    expect(res.stale).toBe(true)
    expect(res.release.version).toBe('0.1.0')
  })
})
