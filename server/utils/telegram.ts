import type { TilNoteMeta } from '~~/utils/til'
import process from 'node:process'
import { noteDraftMessage } from '~~/utils/telegram'
import { reportServerEvent } from './report-error'

/**
 * Sends a message to the owner's Telegram chat through a bot. Best-effort:
 * nothing is sent unless both `NUXT_TELEGRAM_BOT_TOKEN` and
 * `NUXT_TELEGRAM_CHAT_ID` are set, and a failure is logged as a WARNING and
 * never fails the save that triggered it.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const { telegramBotToken: token, telegramChatId: chatId } = useRuntimeConfig()
  if (!token || !chatId || (process.env.VITEST && !process.env.TELEGRAM_TEST_SEND))
    return
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok)
      reportServerEvent('WARNING', 'Telegram rejected a message', { kind: 'telegram', status: res.status })
  }
  catch (err) {
    reportServerEvent('WARNING', 'Telegram send failed', { kind: 'telegram', detail: String(err) })
  }
}

/** Tells the owner a TIL draft is waiting for review in the studio. */
export async function notifyNoteDraft(note: Pick<TilNoteMeta, 'slug' | 'title' | 'topics' | 'excerpt'>, origin: string): Promise<void> {
  await sendTelegramMessage(noteDraftMessage(note, origin))
}
