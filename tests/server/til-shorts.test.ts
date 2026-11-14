import type { TilNoteRecord } from '~~/utils/til'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeNote } from '~~/utils/til'

// A note's first publish starts the YouTube Shorts bot (a Cloud Run Job); no
// other save does. The job call itself is best-effort and production-only.

const mocks = vi.hoisted(() => ({
  enqueued: [] as string[],
  events: [] as Array<[string, string, Record<string, unknown>]>,
}))

vi.mock('~~/server/utils/til-store', () => ({ saveNote: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/indexnow', () => ({ pingIndexNow: vi.fn(async () => {}) }))
vi.mock('~~/server/utils/report-error', () => ({
  reportServerEvent: vi.fn((level: string, msg: string, data: Record<string, unknown>) => mocks.events.push([level, msg, data])),
}))
vi.mock('~~/server/utils/firebase-admin', () => ({ getAdminApp: () => ({ options: { projectId: 'xploit-games' } }) }))
vi.mock('firebase-admin/app', () => ({ applicationDefault: () => ({ getAccessToken: async () => ({ access_token: 'token-123' }) }) }))

const NOW = '2026-11-14T20:00:00.000Z'
const base = { slug: 'node-hang', title: 'How do I restart a hung Node container?', topics: ['devops'], markdown: 'Use a watchdog.' }
const make = (published: boolean, extra: Partial<TilNoteRecord> = {}): TilNoteRecord => ({ ...normalizeNote({ ...base, published }, { now: NOW }), ...extra })

describe('persistNote → enqueueShort', () => {
  beforeEach(async () => {
    mocks.enqueued = []
    vi.doMock('~~/server/utils/shorts', () => ({ enqueueShort: vi.fn(async (slug: string) => mocks.enqueued.push(slug)) }))
    vi.resetModules()
  })
  afterEach(() => vi.doUnmock('~~/server/utils/shorts'))

  it('enqueues on the first publish only', async () => {
    const { persistNote } = await import('~~/server/utils/til-save')
    await persistNote(make(true), null)
    await persistNote(make(true), make(false))
    expect(mocks.enqueued).toEqual(['node-hang', 'node-hang'])
  })

  it('does not enqueue drafts, edits of live notes, or notes that already have a video', async () => {
    const { persistNote } = await import('~~/server/utils/til-save')
    const yt = { id: 'KnHYipswKUs', status: 'public' as const, uploadedAt: NOW }
    await persistNote(make(false), null)
    await persistNote(make(true), make(true))
    await persistNote(make(true, { youtube: yt }), make(false, { youtube: yt }))
    expect(mocks.enqueued).toEqual([])
  })
})

describe('enqueueShort', () => {
  const env = { ...process.env }
  let calls: Array<{ url: string, init: RequestInit }>

  beforeEach(() => {
    vi.resetModules()
    mocks.events = []
    calls = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response('{}', { status: 200 })
    }))
  })
  afterEach(() => {
    process.env = { ...env }
    vi.unstubAllGlobals()
  })

  it('does nothing outside production', async () => {
    const { enqueueShort } = await import('~~/server/utils/shorts')
    await enqueueShort('node-hang')
    expect(calls).toEqual([])
  })

  it('runs the job with the slug, as the backend service account', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.VITEST
    const { enqueueShort } = await import('~~/server/utils/shorts')
    await enqueueShort('node-hang')
    expect(calls).toHaveLength(1)
    expect(calls[0]!.url).toBe('https://run.googleapis.com/v2/projects/xploit-games/locations/us-east4/jobs/shorts-bot:run')
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe('Bearer token-123')
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ overrides: { containerOverrides: [{ args: ['run-short', 'node-hang'] }] } })
    expect(mocks.events).toEqual([])
  })

  it('logs a rejected or failed call as a WARNING and never throws', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.VITEST
    const { enqueueShort } = await import('~~/server/utils/shorts')
    vi.stubGlobal('fetch', vi.fn(async () => new Response('denied', { status: 403 })))
    await enqueueShort('node-hang')
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down')
    }))
    await expect(enqueueShort('node-hang')).resolves.toBeUndefined()
    expect(mocks.events.map(e => [e[0], e[1]])).toEqual([['WARNING', 'Shorts job rejected'], ['WARNING', 'Shorts job start failed']])
  })
})
