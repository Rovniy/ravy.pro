/**
 * Renders an MDC body (what `parseMarkdown` returns) to plain HTML for the RSS
 * feed.
 *
 * The MDC AST is `{ type: 'root' | 'element' | 'text', tag, props, children,
 * value }`. Output is intentionally conservative and matches what the previous
 * minimark renderer produced: only a whitelist of attributes survives, relative
 * URLs are absolutized against `siteUrl`, and everything else is escaped.
 */

interface MdcNode {
  type?: string
  tag?: string
  value?: string
  props?: Record<string, unknown>
  children?: MdcNode[]
}

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

function renderAttrs(props: Record<string, unknown> | undefined, siteUrl: string): string {
  if (!props)
    return ''
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

function renderChildren(children: MdcNode[] | undefined, siteUrl: string): string {
  if (!Array.isArray(children))
    return ''
  return children.map(child => renderNode(child, siteUrl)).join('')
}

function renderNode(node: MdcNode | string, siteUrl: string): string {
  if (typeof node === 'string')
    return escapeHtml(node)
  if (!node || typeof node !== 'object')
    return ''

  if (node.type === 'text')
    return escapeHtml(String(node.value ?? ''))

  // Comments and raw nodes carry nothing a feed reader can use.
  if (node.type === 'comment')
    return ''

  const inner = renderChildren(node.children, siteUrl)

  if (node.type === 'root' || !node.tag)
    return inner

  // Custom MDC components (capitalized) render as their children; the RSS
  // consumer can't do anything with an unknown element anyway.
  const safeTag = /^[a-z][a-z0-9]*$/.test(node.tag) ? node.tag : null
  if (!safeTag)
    return inner
  if (VOID_TAGS.has(safeTag))
    return `<${safeTag}${renderAttrs(node.props, siteUrl)}>`
  return `<${safeTag}${renderAttrs(node.props, siteUrl)}>${inner}</${safeTag}>`
}

export function mdcToHtml(body: unknown, siteUrl: string): string {
  if (!body || typeof body !== 'object')
    return ''
  const children = (body as MdcNode).children
  if (!Array.isArray(children))
    return ''
  return children.map(child => renderNode(child, siteUrl)).join('\n')
}
