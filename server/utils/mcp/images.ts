import { Buffer } from 'node:buffer'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '~~/utils/blog-media'

/**
 * Image intake for the MCP `upload_image` tool.
 *
 * A model has two ways to hand over an image: base64 bytes, or a URL the
 * server fetches. The URL path is a server-side request to a host the caller
 * chose, so it is fenced the usual way: https only, no private or link-local
 * addresses (the Cloud Run metadata server sits on 169.254.169.254), redirects
 * followed by hand so every hop is re-checked, and the body capped while it
 * streams rather than after.
 */

/** Magic-byte sniffing. The declared type of a remote file is not trusted. */
export function sniffImageType(bytes: Uint8Array): string | null {
  const b = bytes
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47)
    return 'image/png'
  if (b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)
    return 'image/jpeg'
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38)
    return 'image/gif'
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP')
    return 'image/webp'
  if (b.length >= 12 && ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12)))
    return 'image/avif'
  return null
}

function ipv4Private(ip: string): boolean {
  const [a = 0, b = 0] = ip.split('.').map(Number)
  return a === 0 || a === 10 || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || a >= 224
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip)
  if (version === 4)
    return ipv4Private(ip)
  if (version === 6) {
    const lower = ip.toLowerCase()
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped?.[1])
      return ipv4Private(mapped[1])
    return lower === '::' || lower === '::1' || /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff')
  }
  return true
}

export class ImageIntakeError extends Error {}

async function assertPublicHost(url: URL): Promise<void> {
  if (url.protocol !== 'https:')
    throw new ImageIntakeError('Only https:// image URLs are accepted.')
  if (url.username || url.password)
    throw new ImageIntakeError('Image URLs must not carry credentials.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.internal') || host.endsWith('.local'))
    throw new ImageIntakeError('That host is not reachable from here.')
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map(a => a.address)
  if (!addresses.length)
    throw new ImageIntakeError(`Could not resolve ${host}.`)
  if (addresses.some(isPrivateAddress))
    throw new ImageIntakeError('That host is not reachable from here.')
}

async function readCapped(res: Response, cap: number): Promise<Buffer> {
  const declared = Number(res.headers.get('content-length') ?? 0)
  if (declared > cap)
    throw new ImageIntakeError('Image is larger than 10 MB.')
  if (!res.body)
    return Buffer.alloc(0)
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done)
      break
    total += value.byteLength
    if (total > cap) {
      await reader.cancel().catch(() => {})
      throw new ImageIntakeError('Image is larger than 10 MB.')
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks)
}

export async function fetchRemoteImage(rawUrl: string): Promise<Buffer> {
  let url: URL
  try {
    url = new URL(rawUrl)
  }
  catch {
    throw new ImageIntakeError('Not a valid URL.')
  }

  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(url)
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: { 'user-agent': 'ravy.pro-blog-mcp/1.0', 'accept': 'image/*' },
    })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location)
        throw new ImageIntakeError(`Redirect without a location from ${url.host}.`)
      url = new URL(location, url)
      continue
    }
    if (!res.ok)
      throw new ImageIntakeError(`Fetching the image failed: HTTP ${res.status}.`)
    return readCapped(res, MAX_IMAGE_BYTES)
  }
  throw new ImageIntakeError('Too many redirects.')
}

export function decodeBase64Image(data: string): Buffer {
  // Accept a data: URL as well as bare base64 — models produce both.
  const stripped = data.replace(/^data:[^;,]+;base64,/, '').replace(/\s+/g, '')
  if (!/^[A-Z0-9+/]+=*$/i.test(stripped))
    throw new ImageIntakeError('data_base64 is not valid base64.')
  if (stripped.length * 0.75 > MAX_IMAGE_BYTES)
    throw new ImageIntakeError('Image is larger than 10 MB.')
  return Buffer.from(stripped, 'base64')
}

/** Longest edge after optimisation — the same ceiling the studio uses in the browser. */
export const MAX_EDGE_PX = 1600

export interface PreparedImage {
  bytes: Buffer
  contentType: string
  extension: string
}

/**
 * Downscales to 1600px and re-encodes as WebP, mirroring what the studio does
 * client-side before an upload. GIFs pass through untouched (animation), and
 * if sharp is unavailable the original bytes are kept — a bigger image beats
 * a failed upload.
 */
export async function prepareImage(bytes: Buffer): Promise<PreparedImage> {
  const type = sniffImageType(bytes)
  if (!type || !ALLOWED_IMAGE_TYPES[type])
    throw new ImageIntakeError('Unsupported image — send PNG, JPEG, WebP, AVIF or GIF.')

  if (type !== 'image/gif') {
    try {
      const { default: sharp } = await import('sharp')
      const out = await sharp(bytes)
        .rotate()
        .resize({ width: MAX_EDGE_PX, height: MAX_EDGE_PX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
      return { bytes: out, contentType: 'image/webp', extension: 'webp' }
    }
    catch {
      // Fall through to the original bytes.
    }
  }
  return { bytes, contentType: type, extension: ALLOWED_IMAGE_TYPES[type] }
}
