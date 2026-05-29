// Pure, synchronous byte-level helpers for reading and writing embedded ICC
// color profiles in JPEG, PNG, and WebP files. No DOM, no WASM — the actual
// color transform (Little CMS) lives in the page component. These functions
// operate on raw bytes so they're SSR-safe and unit-testable.

import { unzlibSync, zlibSync } from 'fflate'

const ICC_SIG = 'ICC_PROFILE\0' // 12 bytes, JPEG APP2 marker prefix
const JPEG_APP2_MAX_CHUNK = 65519 // 65535 - 2 (length) - 12 (sig) - 2 (seq/count)

const textEncoder = /* @__PURE__ */ new TextEncoder()

function asciiBytes(s: string): Uint8Array {
  return textEncoder.encode(s)
}

function startsWithAscii(bytes: Uint8Array, offset: number, ascii: string): boolean {
  if (offset + ascii.length > bytes.length)
    return false
  for (let i = 0; i < ascii.length; i++) {
    if (bytes[offset + i] !== ascii.charCodeAt(i))
      return false
  }
  return true
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

// --- CRC32 (PNG chunks) ----------------------------------------------------
const CRC_TABLE = /* @__PURE__ */ (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++)
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes: Uint8Array): number {
  let c = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++)
    c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

/**
 * Read the human-readable description of an ICC profile from its raw bytes,
 * without a color-management engine. Handles the legacy `desc`
 * (textDescriptionType) and the v4 `mluc` (multiLocalizedUnicodeType) tags.
 * Returns null if no description tag is found or the bytes are malformed.
 */
export function readIccDescription(profile: Uint8Array): string | null {
  if (profile.length < 132)
    return null
  const view = new DataView(profile.buffer, profile.byteOffset, profile.byteLength)
  const tagCount = view.getUint32(128)
  for (let i = 0; i < tagCount; i++) {
    const entry = 132 + i * 12
    if (entry + 12 > profile.length)
      break
    if (!startsWithAscii(profile, entry, 'desc'))
      continue
    const dataOff = view.getUint32(entry + 4)
    if (dataOff + 12 > profile.length)
      return null
    const type = String.fromCharCode(profile[dataOff], profile[dataOff + 1], profile[dataOff + 2], profile[dataOff + 3])
    if (type === 'desc') {
      const asciiLen = view.getUint32(dataOff + 8)
      const start = dataOff + 12
      return readAsciiZ(profile, start, asciiLen)
    }
    if (type === 'mluc') {
      const recSize = view.getUint32(dataOff + 12)
      const firstRec = dataOff + 16
      if (firstRec + recSize > profile.length)
        return null
      const len = view.getUint32(firstRec + 4)
      const off = view.getUint32(firstRec + 8)
      return readUtf16Be(profile, dataOff + off, len)
    }
    return null
  }
  return null
}

function readAsciiZ(bytes: Uint8Array, start: number, len: number): string {
  let s = ''
  for (let i = 0; i < len && start + i < bytes.length; i++) {
    const c = bytes[start + i]
    if (c === 0)
      break
    s += String.fromCharCode(c)
  }
  return s.trim() || ''
}

function readUtf16Be(bytes: Uint8Array, start: number, byteLen: number): string {
  let s = ''
  for (let i = 0; i + 1 < byteLen && start + i + 1 < bytes.length; i += 2) {
    const code = (bytes[start + i] << 8) | bytes[start + i + 1]
    if (code === 0)
      break
    s += String.fromCharCode(code)
  }
  return s.trim() || ''
}

function mimeToFormat(mime: string): 'jpeg' | 'png' | 'webp' | null {
  if (mime === 'image/jpeg' || mime === 'image/jpg')
    return 'jpeg'
  if (mime === 'image/png')
    return 'png'
  if (mime === 'image/webp')
    return 'webp'
  return null
}

// ===========================================================================
// Extraction
// ===========================================================================

export function extractIccProfile(bytes: Uint8Array, mime: string): Uint8Array | null {
  switch (mimeToFormat(mime)) {
    case 'jpeg': return extractFromJpeg(bytes)
    case 'png': return extractFromPng(bytes)
    case 'webp': return extractFromWebp(bytes)
    default: return null
  }
}

function extractFromJpeg(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8)
    return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: { seq: number, data: Uint8Array }[] = []
  let i = 2
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xFF)
      break
    const marker = bytes[i + 1]
    if (marker === 0xD9 || marker === 0xDA) // EOI or start of scan
      break
    if (marker >= 0xD0 && marker <= 0xD7) { // RST markers, no length
      i += 2
      continue
    }
    const length = view.getUint16(i + 2)
    const segStart = i + 4
    const segEnd = i + 2 + length
    if (marker === 0xE2 && startsWithAscii(bytes, segStart, ICC_SIG)) {
      const seq = bytes[segStart + 12]
      const data = bytes.subarray(segStart + 14, segEnd)
      chunks.push({ seq, data })
    }
    i = segEnd
  }
  if (!chunks.length)
    return null
  chunks.sort((a, b) => a.seq - b.seq)
  return concat(chunks.map(c => c.data))
}

function extractFromPng(bytes: Uint8Array): Uint8Array | null {
  if (!startsWithAscii(bytes, 1, 'PNG'))
    return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let i = 8
  while (i + 8 <= bytes.length) {
    const length = view.getUint32(i)
    const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7])
    const dataStart = i + 8
    if (type === 'iCCP') {
      // profile name (1-79 bytes) \0 compression-method(1) compressed-data
      let p = dataStart
      const nameEnd = dataStart + length
      while (p < nameEnd && bytes[p] !== 0)
        p++
      const compressed = bytes.subarray(p + 2, dataStart + length) // skip \0 + method
      try {
        return unzlibSync(compressed)
      }
      catch {
        return null
      }
    }
    if (type === 'IEND')
      break
    i = dataStart + length + 4 // data + CRC
  }
  return null
}

function extractFromWebp(bytes: Uint8Array): Uint8Array | null {
  if (!startsWithAscii(bytes, 0, 'RIFF') || !startsWithAscii(bytes, 8, 'WEBP'))
    return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let i = 12
  while (i + 8 <= bytes.length) {
    const fourcc = String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3])
    const size = view.getUint32(i + 4, true)
    const dataStart = i + 8
    if (fourcc === 'ICCP')
      return bytes.subarray(dataStart, dataStart + size)
    i = dataStart + size + (size & 1) // chunks are even-padded
  }
  return null
}

// ===========================================================================
// Embedding
// ===========================================================================

/**
 * Embed an ICC profile into image bytes. Returns new bytes, or null when the
 * format's embedding isn't supported (WebP) so the caller can fall back.
 */
export function embedIccProfile(bytes: Uint8Array, profile: Uint8Array, mime: string): Uint8Array | null {
  switch (mimeToFormat(mime)) {
    case 'jpeg': return embedInJpeg(bytes, profile)
    case 'png': return embedInPng(bytes, profile)
    case 'webp': return null // VP8X ICCP rewriting is out of scope — caller falls back
    default: return null
  }
}

function embedInJpeg(bytes: Uint8Array, profile: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8)
    return null
  const count = Math.ceil(profile.length / JPEG_APP2_MAX_CHUNK)
  const segments: Uint8Array[] = []
  for (let n = 0; n < count; n++) {
    const chunk = profile.subarray(n * JPEG_APP2_MAX_CHUNK, (n + 1) * JPEG_APP2_MAX_CHUNK)
    const payloadLen = 12 + 2 + chunk.length // sig + seq + count + data
    const segLen = payloadLen + 2 // include the 2 length bytes
    const seg = new Uint8Array(2 + segLen)
    seg[0] = 0xFF
    seg[1] = 0xE2
    seg[2] = (segLen >> 8) & 0xFF
    seg[3] = segLen & 0xFF
    seg.set(asciiBytes(ICC_SIG), 4)
    seg[16] = n + 1 // seq (1-based)
    seg[17] = count
    seg.set(chunk, 18)
    segments.push(seg)
  }
  // Insert after a leading APP0 (JFIF) if present, otherwise right after SOI.
  // APP0 marker is at bytes[2..3]; its 2-byte length is at bytes[4..5].
  let insertAt = 2
  if (bytes[2] === 0xFF && bytes[3] === 0xE0) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    insertAt = 4 + view.getUint16(4)
  }
  return concat([bytes.subarray(0, insertAt), ...segments, bytes.subarray(insertAt)])
}

function embedInPng(bytes: Uint8Array, profile: Uint8Array): Uint8Array | null {
  if (!startsWithAscii(bytes, 1, 'PNG'))
    return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  // IHDR is always the first chunk; insert iCCP right after it.
  const ihdrLen = view.getUint32(8)
  const insertAt = 8 + 8 + ihdrLen + 4 // sig + (len+type) + data + CRC

  const name = asciiBytes('ICC Profile')
  const compressed = zlibSync(profile)
  const chunkData = concat([name, new Uint8Array([0, 0]), compressed]) // name \0 method(0) data
  const typeAndData = concat([asciiBytes('iCCP'), chunkData])
  const chunk = new Uint8Array(4 + typeAndData.length + 4)
  const cv = new DataView(chunk.buffer)
  cv.setUint32(0, chunkData.length)
  chunk.set(typeAndData, 4)
  cv.setUint32(4 + typeAndData.length, crc32(typeAndData))

  return concat([bytes.subarray(0, insertAt), chunk, bytes.subarray(insertAt)])
}
