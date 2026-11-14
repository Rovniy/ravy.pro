import type { InlineKeyboard } from '~~/utils/telegram'
import type { TilNoteRecord } from '~~/utils/til'
import { createHash, timingSafeEqual } from 'node:crypto'
import process from 'node:process'
import { noteDraftKeyboard, noteDraftMessages } from '~~/utils/telegram'
import { noteWarnings } from '~~/utils/til'
import { reportServerEvent } from './report-error'

/**
 * Calls the Bot API with the owner's bot. Best-effort: nothing is sent unless
 * both `NUXT_TELEGRAM_BOT_TOKEN` and `NUXT_TELEGRAM_CHAT_ID` are set (and never
 * from tests), and a failure is logged as a WARNING and never fails the save
 * or the webhook that triggered it. Returns the API result, or null.
 */
export async function telegramApi<T = unknown>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  const { telegramBotToken: token, telegramChatId: chatId } = useRuntimeConfig()
  if (!token || !chatId || (process.env.VITEST && !process.env.TELEGRAM_TEST_SEND))
    return null
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json().catch(() => ({})) as { ok?: boolean, result?: T, description?: string }
    if (!res.ok || !data.ok) {
      reportServerEvent('WARNING', 'Telegram rejected a call', { kind: 'telegram', method, status: res.status, detail: data.description })
      return null
    }
    return data.result ?? null
  }
  catch (err) {
    reportServerEvent('WARNING', 'Telegram call failed', { kind: 'telegram', method, detail: String(err) })
    return null
  }
}

/** Sends a message to the owner's chat (HTML parse mode), with optional buttons. */
export async function sendTelegramMessage(text: string, replyMarkup?: InlineKeyboard): Promise<void> {
  const { telegramChatId: chatId } = useRuntimeConfig()
  await telegramApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })
}

/**
 * Tells the owner a TIL draft is waiting: the whole note in Telegram, with an
 * "Опубликовать" button (handled by /api/telegram/webhook) and a studio link.
 * A long note goes out as several messages; the buttons sit on the last one.
 */
export async function notifyNoteDraft(note: Pick<TilNoteRecord, 'slug' | 'title' | 'topics' | 'createdAt' | 'markdown'>, origin: string): Promise<void> {
  const messages = noteDraftMessages(note, origin, noteWarnings(note))
  for (const [i, text] of messages.entries())
    await sendTelegramMessage(text, i === messages.length - 1 ? noteDraftKeyboard(note.slug, origin) : undefined)
}

/** Constant-time string comparison (both sides hashed, so lengths may differ). */
export function safeEqual(a: string, b: string): boolean {
  const h = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(h(a), h(b))
}
