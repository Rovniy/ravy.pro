import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { decodeBase64Image, fetchRemoteImage, ImageIntakeError, isPrivateAddress, sniffImageType } from '~~/server/utils/mcp/images'

describe('sniffImageType', () => {
  it('recognises each allowed format by its magic bytes', () => {
    expect(sniffImageType(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))).toBe('image/png')
    expect(sniffImageType(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]))).toBe('image/jpeg')
    expect(sniffImageType(Buffer.from('GIF89a'))).toBe('image/gif')
    expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp')
    expect(sniffImageType(Buffer.from('\0\0\0\x1CftypavifX'))).toBe('image/avif')
  })

  // A same-origin SVG is a script; it must not get in under an image label.
  it('rejects svg and html', () => {
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(sniffImageType(Buffer.from('<!doctype html>'))).toBeNull()
  })
})

describe('isPrivateAddress', () => {
  it('blocks loopback, private, link-local and metadata ranges', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])
      expect(isPrivateAddress(ip), ip).toBe(true)
  })

  it('blocks IPv4-mapped addresses in hex form, and NAT64 / 6to4 prefixes', () => {
    // `new URL('https://[::ffff:127.0.0.1]/').hostname` is `[::ffff:7f00:1]`.
    for (const ip of ['::ffff:7f00:1', '::ffff:a9fe:a9fe', '::ffff:c0a8:101', '64:ff9b::7f00:1', '2002:7f00:1::1'])
      expect(isPrivateAddress(ip), ip).toBe(true)
    expect(isPrivateAddress('::ffff:808:808')).toBe(false)
  })

  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '151.101.1.69', '2606:4700::6810:84e5'])
      expect(isPrivateAddress(ip), ip).toBe(false)
  })
})

describe('fetchRemoteImage', () => {
  it('refuses http and private hosts before making a request', async () => {
    await expect(fetchRemoteImage('http://example.com/a.png')).rejects.toBeInstanceOf(ImageIntakeError)
    await expect(fetchRemoteImage('https://169.254.169.254/latest')).rejects.toBeInstanceOf(ImageIntakeError)
    await expect(fetchRemoteImage('https://localhost/a.png')).rejects.toBeInstanceOf(ImageIntakeError)
  })
})

describe('decodeBase64Image', () => {
  it('accepts bare base64 and data URLs', () => {
    expect(decodeBase64Image('R0lGODlh').toString()).toBe('GIF89a')
    expect(decodeBase64Image('data:image/gif;base64,R0lGODlh').toString()).toBe('GIF89a')
  })

  it('rejects non-base64', () => {
    expect(() => decodeBase64Image('not base64!')).toThrow(ImageIntakeError)
  })
})
