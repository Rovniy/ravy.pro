/**
 * Renders a @nuxt/content v3 "minimark" body back to Markdown, for /llms-full.txt.
 *
 * Sibling of `minimark-html.ts` — same node shape, same absolutize-and-be-
 * conservative posture, different output. Markdown rather than HTML because the
 * consumer is a language model: no tags to strip, no attributes to ignore, and
 * roughly 30-40% fewer tokens for the same prose.
 *
 * Minimark nodes are either text strings or `[tag, props, ...children]` tuples.
 * Unknown/custom MDC components render as their children, so component-wrapped
 * prose survives as text instead of disappearing.
 */

type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

/** Tags whose content is a block and needs surrounding blank lines. */
const BLOCK_TAGS = new Set([
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'blockquote',
  'pre',
  'hr',
  'table',
  'div',
  'section',
])

function absolutize(url: string, siteUrl: string): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//'))
    return url
  return url.startsWith('/') ? `${siteUrl}${url}` : url
}

function attr(props: Record<string, unknown>, key: string): string {
  const value = props?.[key]
  return value == null ? '' : String(value)
}

function renderChildren(children: MinimarkNode[], siteUrl: string, depth: number): string {
  return children.map(child => render(child, siteUrl, depth)).join('')
}

function render(node: MinimarkNode, siteUrl: string, depth = 0): string {
  if (typeof node === 'string')
    return node
  if (!Array.isArray(node))
    return ''

  const [rawTag, props = {}, ...children] = node
  const tag = String(rawTag).toLowerCase()
  const p = props as Record<string, unknown>

  switch (tag) {
    case 'h1':
      return `\n\n# ${renderChildren(children, siteUrl, depth)}\n`
    case 'h2':
      return `\n\n## ${renderChildren(children, siteUrl, depth)}\n`
    case 'h3':
      return `\n\n### ${renderChildren(children, siteUrl, depth)}\n`
    case 'h4':
      return `\n\n#### ${renderChildren(children, siteUrl, depth)}\n`
    case 'h5':
    case 'h6':
      return `\n\n##### ${renderChildren(children, siteUrl, depth)}\n`

    case 'p':
      return `\n\n${renderChildren(children, siteUrl, depth)}\n`

    case 'strong':
    case 'b':
      return `**${renderChildren(children, siteUrl, depth)}**`
    case 'em':
    case 'i':
      return `*${renderChildren(children, siteUrl, depth)}*`
    case 'del':
    case 's':
      return `~~${renderChildren(children, siteUrl, depth)}~~`

    case 'code': {
      const text = renderChildren(children, siteUrl, depth)
      // A fenced block already handled by `pre`; inline code gets backticks.
      return `\`${text.replace(/`/g, '')}\``
    }
    case 'pre': {
      // Shiki hands the raw source through `code`; language lives on the node.
      const lang = attr(p, 'language') || attr(p, 'lang') || ''
      const raw = attr(p, 'code') || renderChildren(children, siteUrl, depth).replace(/^`|`$/g, '')
      return `\n\n\`\`\`${lang}\n${raw.replace(/\n+$/, '')}\n\`\`\`\n`
    }

    case 'a': {
      const href = absolutize(attr(p, 'href'), siteUrl)
      const text = renderChildren(children, siteUrl, depth) || href
      return href ? `[${text}](${href})` : text
    }
    case 'img': {
      const src = absolutize(attr(p, 'src'), siteUrl)
      return src ? `![${attr(p, 'alt')}](${src})` : ''
    }

    case 'ul':
    case 'ol': {
      const items = children
        .filter((c): c is [string, Record<string, unknown>, ...MinimarkNode[]] =>
          Array.isArray(c) && String(c[0]).toLowerCase() === 'li')
        .map((c, i) => {
          const marker = tag === 'ol' ? `${i + 1}.` : '-'
          const inner = renderChildren(c.slice(2) as MinimarkNode[], siteUrl, depth + 1)
            .replace(/\n{2,}/g, '\n')
            .trim()
          const indent = '  '.repeat(depth)
          return `${indent}${marker} ${inner}`
        })
      return `\n\n${items.join('\n')}\n`
    }
    case 'li':
      return renderChildren(children, siteUrl, depth)

    case 'blockquote':
      return `\n\n${renderChildren(children, siteUrl, depth).trim().split('\n').map(l => `> ${l}`).join('\n')}\n`

    case 'hr':
      return '\n\n---\n'
    case 'br':
      return '\n'

    // Tables: keep the cell text with pipe separators. Not a faithful GFM table
    // (no alignment row per column count), but readable and unambiguous.
    case 'tr':
      return `\n| ${children.map(c => render(c, siteUrl, depth).trim()).join(' | ')} |`
    case 'th':
    case 'td':
      return renderChildren(children, siteUrl, depth)
    case 'table':
    case 'thead':
    case 'tbody':
      return `${renderChildren(children, siteUrl, depth)}\n`

    default:
      // Unknown or custom (capitalised) component: emit its children so prose
      // wrapped in an MDC component isn't lost.
      return BLOCK_TAGS.has(tag)
        ? `\n\n${renderChildren(children, siteUrl, depth)}\n`
        : renderChildren(children, siteUrl, depth)
  }
}

export function minimarkToMarkdown(body: unknown, siteUrl: string): string {
  if (!body || typeof body !== 'object')
    return ''
  const value = (body as { type?: string, value?: unknown }).type === 'minimark'
    ? (body as { value?: unknown }).value
    : null
  if (!Array.isArray(value))
    return ''

  return value
    .map(node => render(node as MinimarkNode, siteUrl))
    .join('')
    // Collapse the generous newlines the recursive render emits.
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
