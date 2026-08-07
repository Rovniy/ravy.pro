import { describe, expect, it } from 'vitest'
import { parseRelease } from '../../utils/github-release'

function asset(name: string, size = 1024) {
  return { name, size, browser_download_url: `https://example.com/${name}` }
}

const payload = {
  tag_name: 'v0.1.0',
  html_url: 'https://github.com/Rovniy/windows-translater/releases/tag/0.1.0',
  published_at: '2026-08-06T17:24:34Z',
  assets: [
    asset('SHA256SUMS.txt', 213),
    asset('XPLOIT-Translator_0.1.0_x64-portable.exe', 8_955_904),
    asset('XPLOIT-Translator_0.1.0_x64-setup.exe', 2_535_903),
  ],
}

describe('parseRelease', () => {
  it('normalises a release and matches assets by suffix, not by order', () => {
    const r = parseRelease(payload)!

    expect(r.version).toBe('0.1.0')
    expect(r.url).toBe(payload.html_url)
    expect(r.publishedAt).toBe('2026-08-06T17:24:34Z')
    expect(r.installer?.name).toBe('XPLOIT-Translator_0.1.0_x64-setup.exe')
    expect(r.installer?.size).toBe(2_535_903)
    expect(r.portable?.name).toBe('XPLOIT-Translator_0.1.0_x64-portable.exe')
    expect(r.checksums?.name).toBe('SHA256SUMS.txt')
  })

  it('accepts a tag without the leading v', () => {
    expect(parseRelease({ ...payload, tag_name: '1.2.3' })?.version).toBe('1.2.3')
  })

  it('leaves a missing asset null instead of guessing', () => {
    const r = parseRelease({ ...payload, assets: [asset('XPLOIT-Translator_0.2.0_x64-setup.exe')] })!
    expect(r.installer).not.toBeNull()
    expect(r.portable).toBeNull()
    expect(r.checksums).toBeNull()
  })

  it('drops assets with no download url', () => {
    const r = parseRelease({ ...payload, assets: [{ name: 'broken-setup.exe', size: 10 }] })!
    expect(r.installer).toBeNull()
  })

  it('returns null for anything that is not a release', () => {
    expect(parseRelease(null)).toBeNull()
    expect(parseRelease('nope')).toBeNull()
    expect(parseRelease({})).toBeNull()
    expect(parseRelease({ message: 'Not Found' })).toBeNull()
    expect(parseRelease({ tag_name: '   ' })).toBeNull()
  })

  it('survives a release with no assets array', () => {
    const r = parseRelease({ tag_name: 'v0.3.0' })!
    expect(r.version).toBe('0.3.0')
    expect(r.url).toBe('')
    expect(r.publishedAt).toBe('')
    expect(r.installer).toBeNull()
  })
})
