import type { TilNoteRecord } from '~~/utils/til'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeNote } from '~~/utils/til'

// The "Опубликовать" button under a Telegram draft notice: who may press it,
// and that a press publishes through the studio's save path exactly once.

const mocks = vi.hoisted(() => ({
  notes: new Map<string, TilNoteRecord>(),
  saved: [] as TilNoteRecord[],
  enqueued: [] as string[],
  calls: [] as Array<{ method: string, body: Record<string, unknown> }>,
  headers: {} as Record<string, string>,
  body: undefined as unknown,
}))

vi.mock('~~/server/utils/til-store', () => ({
  getNote: vi.fn(async (slug: string) => mocks.notes.get(slug) ?? null),
  saveNote: vi.fn(async (note: TilNoteRecord) => {
    mocks.saved.push(note)
    mocks.notes.set(note.slug, note)
  }),
}))
vi.mock('~~/server/utils/indexnow', () => ({ pingIndexNow: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/shorts', () => ({ enqueueShort: vi.fn(async (slug: string) => mocks.enqueued.push(slug)) }))
vi.mock('~~/server/utils/report-error', () => ({ reportServerEvent: vi.fn() }))

const SECRET = 'test-webhook-secret'
const OWNER = 478051581
const NOW = '2026-11-14T20:00:00.000Z'

function draft(slug = 'node-hang', published = false): TilNoteRecord {
  return normalizeNote({ slug, title: 'How do I restart a hung Node container?', topics: ['devops'], markdown: 'Use a watchdog.', published }, { now: NOW })
}

function press(data: string, fromId = OWNER) {
  mocks.body = { update_id: 1, callback_query: { id: 'cq1', from: { id: fromId }, data, message: { message_id: 7, chat: { id: OWNER } } } }
}

async function handler() {
  return (await import('~~/server/api/telegram/webhook.post')).default as unknown as (e: unknown) => Promise<{ ok: boolean }>
}

describe('pOST /api/telegram/webhook', () => {
  beforeEach(() => {
    vi.resetModules()
    mocks.notes = new Map([['node-hang', draft()]])
    mocks.saved = []
    mocks.enqueued = []
    mocks.calls = []
    mocks.headers = { 'x-telegram-bot-api-secret-token': SECRET }
    process.env.TELEGRAM_TEST_SEND = '1'
    vi.stubGlobal('useRuntimeConfig', () => ({ telegramBotToken: 'bot-token', telegramChatId: String(OWNER), telegramWebhookSecret: SECRET }))
    vi.stubGlobal('getRequestHeader', (_e: unknown, name: string) => mocks.headers[name.toLowerCase()])
    vi.stubGlobal('readBody', async () => mocks.body)
    vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage: string }) => Object.assign(new Error(opts.statusMessage), { statusCode: opts.statusCode }))
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      mocks.calls.push({ method: url.split('/').pop()!, body: JSON.parse(String(init.body)) })
      return new Response(JSON.stringify({ ok: true, result: true }), { status: 200 })
    }))
  })
  afterEach(() => {
    delete process.env.TELEGRAM_TEST_SEND
  })

  it('rejects a request without the right secret', async () => {
    const h = await handler()
    press('til:publish:node-hang')
    mocks.headers = { 'x-telegram-bot-api-secret-token': 'wrong' }
    await expect(h({})).rejects.toMatchObject({ statusCode: 401 })
    mocks.headers = {}
    await expect(h({})).rejects.toMatchObject({ statusCode: 401 })
    expect(mocks.saved).toEqual([])
  })

  it('ignores a press from anyone but the owner', async () => {
    const h = await handler()
    press('til:publish:node-hang', 12345)
    await expect(h({})).resolves.toEqual({ ok: true })
    expect(mocks.saved).toEqual([])
    expect(mocks.calls.map(c => [c.method, c.body.text])).toEqual([['answerCallbackQuery', 'Нет доступа']])
  })

  it('publishes a draft once, through the save path, and swaps the buttons', async () => {
    const h = await handler()
    press('til:publish:node-hang')
    await expect(h({})).resolves.toEqual({ ok: true })
    expect(mocks.saved).toHaveLength(1)
    expect(mocks.saved[0]!.published).toBe(true)
    expect(mocks.enqueued).toEqual(['node-hang'])
    expect(mocks.calls.map(c => c.method)).toEqual(['answerCallbackQuery', 'editMessageReplyMarkup'])
    expect(mocks.calls[0]!.body.text).toBe('Опубликовано')
    expect(mocks.calls[1]!.body).toMatchObject({ chat_id: OWNER, message_id: 7 })
  })

  it('does nothing to a note that is already published', async () => {
    mocks.notes.set('node-hang', draft('node-hang', true))
    const h = await handler()
    press('til:publish:node-hang')
    await h({})
    expect(mocks.saved).toEqual([])
    expect(mocks.enqueued).toEqual([])
    expect(mocks.calls[0]!.body.text).toBe('Уже опубликована')
  })

  it('answers when the note is gone, and ignores other updates', async () => {
    const h = await handler()
    press('til:publish:missing-note')
    await h({})
    expect(mocks.calls[0]!.body.text).toBe('Заметка не найдена')
    mocks.calls = []
    mocks.body = { update_id: 2, message: { chat: { id: OWNER }, text: 'hi' } }
    await expect(h({})).resolves.toEqual({ ok: true })
    expect(mocks.calls).toEqual([])
    expect(mocks.saved).toEqual([])
  })
})
