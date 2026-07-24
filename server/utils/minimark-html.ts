/**
 * Renders a @nuxt/content v3 "minimark" body to plain HTML for the RSS feed.
 *
 * Minimark nodes are either text strings or `[tag, props, ...children]`
 * tuples. Output is intentionally conservative: only a whitelist of
 * attributes survives, relative URLs are absolutized against `siteUrl`,
 * and everything else is escaped.
 */

type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'width', 'height', 'lang'])
const VOID_TAGS = new Set(['img', 'br', 'hr'])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function absolutize(url: string, siteUrl: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//'))
    return url
  return url.startsWith('/') ? `${siteUrl}${url}` : url
}

function renderAttrs(props: Record<string, unknown>, siteUrl: string): string {
  let out = ''
  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_ATTRS.has(key) || value == null)
      continue
    const str = String(value)
    const final = (key === 'href' || key === 'src') ? absolutize(str, siteUrl) : str
    out += ` ${key}="${escapeHtml(final)}"`
  }
  return out
}

function renderNode(node: MinimarkNode, siteUrl: string): string {
  if (typeof node === 'string')
    return escapeHtml(node)
  if (!Array.isArray(node))
    return ''

  const [tag, props = {}, ...children] = node
  // Custom MDC components (capitalized) render as their children; the RSS
  // consumer can't do anything with an unknown element anyway.
  const safeTag = /^[a-z][a-z0-9]*$/.test(tag) ? tag : null
  const inner = children.map(child => renderNode(child, siteUrl)).join('')

  if (!safeTag)
    return inner
  if (VOID_TAGS.has(safeTag))
    return `<${safeTag}${renderAttrs(props as Record<string, unknown>, siteUrl)}>`
  return `<${safeTag}${renderAttrs(props as Record<string, unknown>, siteUrl)}>${inner}</${safeTag}>`
}

export function minimarkToHtml(body: unknown, siteUrl: string): string {
  if (!body || typeof body !== 'object')
    return ''
  const value = (body as { type?: string, value?: unknown }).type === 'minimark'
    ? (body as { value?: unknown }).value
    : null
  if (!Array.isArray(value))
    return ''
  return value.map(node => renderNode(node as MinimarkNode, siteUrl)).join('\n')
}
