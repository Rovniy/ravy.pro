import { describe, expect, it } from 'vitest'
import { crc32, embedIccProfile, extractIccProfile } from '../../utils/icc'

// --- helpers: build minimal valid containers -------------------------------

function makeMinimalJpeg(): Uint8Array {
  // SOI + EOI is enough for our marker-walking extract/embed logic.
  return new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])
}

function makeJpegWithApp0(): Uint8Array {
  // SOI + a tiny APP0 (JFIF-ish) segment + EOI.
  const app0 = [0xFF, 0xE0, 0x00, 0x04, 0x00, 0x00] // length 4 → 2 bytes payload
  return new Uint8Array([0xFF, 0xD8, ...app0, 0xFF, 0xD9])
}

function u32(n: number): number[] {
  return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]
}

function ascii(s: string): number[] {
  return [...s].map(c => c.charCodeAt(0))
}

function makeMinimalPng(): Uint8Array {
  const sig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  // IHDR: 13-byte data (content irrelevant to our chunk logic)
  const ihdrData = Array.from({ length: 13 }).fill(0)
  const ihdr = [...u32(13), ...ascii('IHDR'), ...ihdrData, ...u32(0)]
  const iend = [...u32(0), ...ascii('IEND'), ...u32(0)]
  return new Uint8Array([...sig, ...ihdr, ...iend])
}

function makeWebpWithIccp(profile: Uint8Array): Uint8Array {
  const iccpSize = profile.length
  const padded = iccpSize + (iccpSize & 1)
  const iccp = [...ascii('ICCP'), iccpSize & 0xFF, (iccpSize >> 8) & 0xFF, (iccpSize >> 16) & 0xFF, (iccpSize >> 24) & 0xFF, ...profile]
  if (padded > iccpSize)
    iccp.push(0)
  const body = [...ascii('WEBP'), ...iccp]
  const riffSize = body.length
  return new Uint8Array([...ascii('RIFF'), riffSize & 0xFF, (riffSize >> 8) & 0xFF, (riffSize >> 16) & 0xFF, (riffSize >> 24) & 0xFF, ...body])
}

function sampleProfile(len: number): Uint8Array {
  const p = new Uint8Array(len)
  for (let i = 0; i < len; i++)
    p[i] = (i * 7 + 13) & 0xFF
  return p
}

// --- crc32 -----------------------------------------------------------------

describe('crc32', () => {
  it('matches the standard test vector', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xCBF43926)
  })
})

// --- JPEG round-trip -------------------------------------------------------

describe('iCC — JPEG', () => {
  it('embeds and extracts a profile (round-trip)', () => {
    const profile = sampleProfile(200)
    const out = embedIccProfile(makeMinimalJpeg(), profile, 'image/jpeg')!
    expect(out).not.toBeNull()
    expect(extractIccProfile(out, 'image/jpeg')).toEqual(profile)
  })

  it('inserts after a leading APP0 segment', () => {
    const profile = sampleProfile(50)
    const out = embedIccProfile(makeJpegWithApp0(), profile, 'image/jpeg')!
    expect(extractIccProfile(out, 'image/jpeg')).toEqual(profile)
  })

  it('splits large profiles across multiple APP2 segments', () => {
    const profile = sampleProfile(140000) // > 2 * 65519 → 3 segments
    const out = embedIccProfile(makeMinimalJpeg(), profile, 'image/jpeg')!
    expect(extractIccProfile(out, 'image/jpeg')).toEqual(profile)
  })

  it('returns null profile when none is embedded', () => {
    expect(extractIccProfile(makeMinimalJpeg(), 'image/jpeg')).toBeNull()
  })
})

// --- PNG round-trip --------------------------------------------------------

describe('iCC — PNG', () => {
  it('embeds and extracts a profile (round-trip, zlib)', () => {
    const profile = sampleProfile(512)
    const out = embedIccProfile(makeMinimalPng(), profile, 'image/png')!
    expect(out).not.toBeNull()
    expect(extractIccProfile(out, 'image/png')).toEqual(profile)
  })

  it('returns null profile when none is embedded', () => {
    expect(extractIccProfile(makeMinimalPng(), 'image/png')).toBeNull()
  })
})

// --- WebP ------------------------------------------------------------------

describe('iCC — WebP', () => {
  it('extracts a profile from an ICCP chunk', () => {
    const profile = sampleProfile(101) // odd length → exercises even-padding
    const webp = makeWebpWithIccp(profile)
    expect(extractIccProfile(webp, 'image/webp')).toEqual(profile)
  })

  it('returns null for embedding (unsupported → caller falls back)', () => {
    expect(embedIccProfile(makeWebpWithIccp(sampleProfile(10)), sampleProfile(20), 'image/webp')).toBeNull()
  })
})

// --- dispatch --------------------------------------------------------------

describe('extractIccProfile dispatch', () => {
  it('returns null for unsupported mime', () => {
    expect(extractIccProfile(makeMinimalPng(), 'application/pdf')).toBeNull()
  })
})
