// Pure, synchronous helpers for the image converter tool.
// No DOM, no canvas, no async — the actual pixel work (createImageBitmap +
// canvas.toBlob) is browser-only and lives in the page component. Keeping this
// file side-effect-free makes it SSR-safe and trivially unit-testable.

export type OutputFormat = 'png' | 'jpeg' | 'webp'

export interface FormatSpec {
  id: OutputFormat
  label: string
  mime: string
  /** File extension used for the converted output (jpeg → "jpg"). */
  extension: string
  /** Whether the encoder honours a quality value (0..1). */
  lossy: boolean
}

export const FORMATS: FormatSpec[] = [
  { id: 'png', label: 'PNG', mime: 'image/png', extension: 'png', lossy: false },
  { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg', extension: 'jpg', lossy: true },
  { id: 'webp', label: 'WebP', mime: 'image/webp', extension: 'webp', lossy: true },
]

export function getFormat(id: OutputFormat): FormatSpec {
  return FORMATS.find(f => f.id === id) ?? FORMATS[0] as FormatSpec
}

/** Input MIME types we accept. GIF is intentionally excluded. */
export const ACCEPTED_INPUT_MIME: string[] = ['image/png', 'image/jpeg', 'image/webp']

const ACCEPTED_INPUT_EXT = ['png', 'jpg', 'jpeg', 'webp']

/**
 * Whether a file is something we can convert. Matches on MIME first, then falls
 * back to the file extension (some browsers report an empty `type` on drop).
 * Takes a plain `{ type, name }` shape so it can be unit-tested without a `File`.
 */
export function isSupportedInput(file: { type: string, name: string }): boolean {
  const type = (file.type || '').toLowerCase()
  if (type)
    return ACCEPTED_INPUT_MIME.includes(type)
  const ext = extensionOf(file.name)
  return ext !== null && ACCEPTED_INPUT_EXT.includes(ext)
}

function extensionOf(name: string): string | null {
  const i = name.lastIndexOf('.')
  if (i <= 0 || i === name.length - 1)
    return null
  return name.slice(i + 1).toLowerCase()
}

/**
 * Replace a file name's extension with `ext`.
 * - no extension:           "photo"               -> "photo.<ext>"
 * - uppercase extension:    "IMG.JPEG"             -> "IMG.<ext>"
 * - multiple dots:          "my.photo.final.png"   -> "my.photo.final.<ext>"
 * - dotfile (leading dot):  ".gitignore"           -> ".gitignore.<ext>"
 * - empty/whitespace name:  ""                     -> "image.<ext>"
 */
export function buildOutputName(originalName: string, ext: string): string {
  const name = (originalName || '').trim()
  if (!name)
    return `image.${ext}`
  const i = name.lastIndexOf('.')
  const base = i > 0 ? name.slice(0, i) : name
  return `${base}.${ext}`
}

/** Human-readable byte size (base 1024, one decimal for KB+). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0)
    return '0 B'
  if (bytes < 1024)
    return `${Math.round(bytes)} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

/**
 * Percent size change from original to converted.
 * Positive = smaller output (saved), negative = larger output.
 * Returns 0 when the original size is unknown/zero.
 */
export function savingsPercent(orig: number, converted: number): number {
  if (!Number.isFinite(orig) || orig <= 0)
    return 0
  return Math.round((1 - converted / orig) * 100)
}
