import { baseData } from '~~/data'
import { reportServerEvent } from '~~/server/utils/report-error'
import { safeEqual, telegramApi } from '~~/server/utils/telegram'
import { publishStoredNote } from '~~/server/utils/til-save'
import { notePublishedKeyboard, parsePublishCallback } from '~~/utils/telegram'
import { TilNoteValidationError } from '~~/utils/til'

interface CallbackQuery {
  id: string
  from?: { id?: number }
  data?: string
  message?: { message_id?: number, chat?: { id?: number } }
}

/**
 * Telegram webhook for the owner's bot. It only acts on the "Опубликовать"
 * button under a TIL draft notice (`til:publish:<slug>`), and only when:
 *  - the request carries the secret set with setWebhook's `secret_token`
 *    (`NUXT_TELEGRAM_WEBHOOK_SECRET`), compared in constant time, else 401;
 *  - the button was pressed by the owner (`from.id` is the configured chat).
 * Every other update is acknowledged and ignored. Telegram gets a 200 quickly
 * either way, so it never retries a publish.
 */
export default defineEventHandler(async (event) => {
  const { telegramWebhookSecret: secret, telegramChatId: chatId } = useRuntimeConfig()
  const given = getRequestHeader(event, 'x-telegram-bot-api-secret-token') ?? ''
  if (!secret || !safeEqual(given, String(secret)))
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const update = await readBody<{ callback_query?: CallbackQuery }>(event)
  const cq = update?.callback_query
  if (!cq?.id)
    return { ok: true }

  const answer = (text: string) => telegramApi('answerCallbackQuery', { callback_query_id: cq.id, text })
  if (!chatId || String(cq.from?.id ?? '') !== String(chatId)) {
    await answer('Нет доступа')
    return { ok: true }
  }
  const slug = parsePublishCallback(cq.data)
  if (!slug) {
    await answer('')
    return { ok: true }
  }

  const origin = baseData.site.url
  const markDone = () => cq.message?.message_id && cq.message.chat?.id
    ? telegramApi('editMessageReplyMarkup', { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: notePublishedKeyboard(slug, origin) })
    : null
  try {
    const result = await publishStoredNote(slug)
    if (result === 'missing') {
      await answer('Заметка не найдена')
    }
    else {
      await answer(result === 'already' ? 'Уже опубликована' : 'Опубликовано')
      await markDone()
    }
  }
  catch (err) {
    const message = err instanceof TilNoteValidationError ? err.message : 'Не получилось опубликовать'
    if (!(err instanceof TilNoteValidationError))
      reportServerEvent('ERROR', 'Telegram publish failed', { kind: 'telegram', slug, detail: String(err) })
    await answer(message.slice(0, 190))
  }
  return { ok: true }
})
