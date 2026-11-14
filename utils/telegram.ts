import type { TilNoteRecord } from './til'
import { tilTopic } from '../data/til'

/**
 * Telegram Bot API helpers. Pure, so the message shape is unit-tested; the
 * sends and the webhook live in `server/utils/telegram.ts` and
 * `server/api/telegram/webhook.post.ts`.
 */

/** Escapes the three characters Telegram's HTML parse mode treats as markup. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Telegram rejects a message over 4096 characters. */
export const TELEGRAM_MAX_CHARS = 4096
/** What we pack into one message: below the limit, with room for a closing tag. */
const PACK_LIMIT = 3900

/** `callback_data` is at most 64 bytes. */
const CALLBACK_MAX_BYTES = 64
const PUBLISH_PREFIX = 'til:publish:'

export interface InlineButton {
  text: string
  url?: string
  callback_data?: string
}
export interface InlineKeyboard {
  inline_keyboard: InlineButton[][]
}

function absolute(url: string, origin: string): string {
  return url.startsWith('/') ? `${origin}${url}` : url
}

/** One line of markdown prose → Telegram HTML: inline code, links, bold, italics. */
function inlineToHtml(line: string, origin: string): string {
  // Inline code first, so nothing inside it is read as formatting.
  return line.split(/(`[^`\n]+`)/).map((part) => {
    if (/^`[^`\n]+`$/.test(part))
      return `<code>${escapeTelegramHtml(part.slice(1, -1))}</code>`
    let s = escapeTelegramHtml(part)
    s = s.replace(/!?\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) =>
      `<a href="${absolute(url, origin).replace(/"/g, '&quot;')}">${text || url}</a>`)
    s = s.replace(/\*\*(\S(?:.*?\S)?)\*\*/g, '<b>$1</b>')
    s = s.replace(/(^|[\s(])[*_](\S(?:.*?\S)?)[*_](?=[\s).,;:!?]|$)/g, '$1<i>$2</i>')
    return s
  }).join('')
}

/**
 * Note markdown → blocks of Telegram HTML (a paragraph, a list item, a code
 * block each). Fenced code becomes `<pre><code class="language-x">`, headings
 * bold lines, list items "• " lines. Relative links get the site origin.
 */
export function markdownToTelegramBlocks(markdown: string, origin: string): string[] {
  const blocks: string[] = []
  const parts = String(markdown ?? '').replace(/\r\n/g, '\n').split(/^```([\w-]*)[^\S\n]*\n([\s\S]*?)^```[^\S\n]*$/m)
  // split() with two capture groups: [prose, lang, code, prose, lang, code, …]
  for (let i = 0; i < parts.length; i += 3) {
    let paragraph: string[] = []
    const flush = () => {
      if (paragraph.length)
        blocks.push(paragraph.join('\n'))
      paragraph = []
    }
    for (const raw of (parts[i] ?? '').split('\n')) {
      const line = raw.trimEnd()
      if (!line.trim()) {
        flush()
        continue
      }
      const heading = /^ {0,3}#{1,6} +(\S.*)$/.exec(line)
      const bullet = /^ *[-*+] +(\S.*)$/.exec(line)
      if (heading) {
        flush()
        blocks.push(`<b>${inlineToHtml(heading[1]!, origin)}</b>`)
      }
      else if (bullet) {
        flush()
        blocks.push(`• ${inlineToHtml(bullet[1]!, origin)}`)
      }
      else {
        paragraph.push(inlineToHtml(line.replace(/^>\s?/, ''), origin))
      }
    }
    flush()
    if (i + 2 < parts.length) {
      const lang = parts[i + 1]
      const code = escapeTelegramHtml((parts[i + 2] ?? '').replace(/\n$/, ''))
      blocks.push(lang ? `<pre><code class="language-${lang}">${code}</code></pre>` : `<pre>${code}</pre>`)
    }
  }
  return blocks
}

/**
 * Cuts a block that alone exceeds the limit. Only code blocks get that long (a
 * note is at most 4000 characters), so the cut keeps the code tags balanced and
 * never ends inside an HTML entity; any other block falls back to plain text.
 */
function cutBlock(block: string, limit: number): string {
  if (block.length <= limit)
    return block
  const pre = /^(<pre>(?:<code[^>]*>)?)([\s\S]*?)((?:<\/code>)?<\/pre>)$/.exec(block)
  if (pre) {
    const body = pre[2]!.slice(0, limit - pre[1]!.length - pre[3]!.length - 2).replace(/&[a-z]*$/, '')
    return `${pre[1]}${body}…${pre[3]}`
  }
  const text = block.replace(/<[^>]+>/g, '')
  return `${text.slice(0, limit - 2).replace(/&[a-z]*$/, '')}…`
}

/** Packs blocks into messages under the limit; a single oversized block is cut. */
export function packMessages(head: string, blocks: string[], limit = PACK_LIMIT): string[] {
  const messages: string[] = []
  let current = head
  for (const block of blocks) {
    const piece = cutBlock(block, limit)
    if (current && current.length + 2 + piece.length > limit) {
      messages.push(current)
      current = piece
    }
    else {
      current = current ? `${current}\n\n${piece}` : piece
    }
  }
  if (current)
    messages.push(current)
  return messages
}

/**
 * The notice for a new TIL draft: title, topics, slug, date and save warnings,
 * then the whole note. Returned as one or more messages under Telegram's
 * limit; the buttons go on the last one.
 */
export function noteDraftMessages(
  note: Pick<TilNoteRecord, 'slug' | 'title' | 'topics' | 'createdAt' | 'markdown'>,
  origin: string,
  warnings: string[] = [],
): string[] {
  const topics = note.topics.map(id => tilTopic(id)?.name ?? id).join(', ')
  const head = [
    '📝 <b>Новый TIL-черновик</b>',
    '',
    `<b>${escapeTelegramHtml(note.title)}</b>`,
    `Темы: ${escapeTelegramHtml(topics)}`,
    `<code>${escapeTelegramHtml(note.slug)}</code>${note.createdAt ? ` · ${escapeTelegramHtml(note.createdAt.slice(0, 10))}` : ''}`,
    ...(warnings.length ? ['', ...warnings.map(w => `⚠️ ${escapeTelegramHtml(w)}`)] : []),
    '',
    '———',
  ].join('\n')
  return packMessages(head, markdownToTelegramBlocks(note.markdown, origin))
}

/** Publish + open-in-studio buttons under a draft notice. */
export function noteDraftKeyboard(slug: string, origin: string): InlineKeyboard {
  const studio: InlineButton = { text: 'Открыть в студии', url: `${origin}/studio/notes/${slug}` }
  const data = `${PUBLISH_PREFIX}${slug}`
  // A slug too long for callback_data still gets the studio link.
  if (new TextEncoder().encode(data).length > CALLBACK_MAX_BYTES)
    return { inline_keyboard: [[studio]] }
  return { inline_keyboard: [[{ text: 'Опубликовать', callback_data: data }, studio]] }
}

/** What replaces the buttons once the note is live. */
export function notePublishedKeyboard(slug: string, origin: string): InlineKeyboard {
  return { inline_keyboard: [[{ text: '✅ Опубликовано — открыть', url: `${origin}/til/${slug}` }]] }
}

/** `til:publish:<slug>` → slug; null for any other callback. */
export function parsePublishCallback(data: unknown): string | null {
  if (typeof data !== 'string' || !data.startsWith(PUBLISH_PREFIX))
    return null
  const slug = data.slice(PUBLISH_PREFIX.length)
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : null
}
