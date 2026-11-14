import type { TilNoteMeta } from './til'

/**
 * Telegram Bot API text helpers. Pure, so the message shape is unit-tested;
 * the send itself lives in `server/utils/telegram.ts`.
 */

/** Escapes the three characters Telegram's HTML parse mode treats as markup. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Telegram rejects a message over 4096 characters. */
export const TELEGRAM_MAX_CHARS = 4096

/**
 * The notice sent when a TIL draft appears through MCP: what it is, and the
 * studio link where it is read and published.
 */
export function noteDraftMessage(note: Pick<TilNoteMeta, 'slug' | 'title' | 'topics' | 'excerpt'>, origin: string): string {
  const studio = `${origin}/studio/notes/${note.slug}`
  const lines = [
    '📝 <b>Новый TIL-черновик</b>',
    '',
    `<b>${escapeTelegramHtml(note.title)}</b>`,
    escapeTelegramHtml(note.excerpt),
    '',
    `Темы: ${escapeTelegramHtml(note.topics.join(', '))}`,
    `Прочитать и опубликовать: ${studio}`,
  ]
  const text = lines.join('\n')
  return text.length <= TELEGRAM_MAX_CHARS ? text : `${text.slice(0, TELEGRAM_MAX_CHARS - 1)}…`
}
