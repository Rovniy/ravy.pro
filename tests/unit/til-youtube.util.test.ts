import type { TilNoteRecord } from '~/utils/til'
import { describe, expect, it } from 'vitest'
import { runShortBody, SHORTS_JOB, shortsJobRunUrl } from '~/utils/shorts-job'
import { isFirstPublish, normalizeNote, noteFromDoc, noteYoutubeFromDoc, publicVideo, toNoteMeta } from '~/utils/til'

// The note's YouTube Short: written by the shorts bot only, carried across
// studio edits, kept out of the index, shown only once public.

const NOW = '2026-11-14T20:00:00.000Z'
const yt = { id: 'KnHYipswKUs', status: 'private' as const, uploadedAt: '2026-11-14T20:58:17.845Z' }
const input = { slug: 'node-hang', title: 'How do I restart a hung Node container?', topics: ['devops'], markdown: 'Use a watchdog on a worker thread.', published: true }

function note(over: Partial<TilNoteRecord> = {}): TilNoteRecord {
  return { ...normalizeNote(input, { now: NOW }), ...over }
}

describe('noteYoutubeFromDoc', () => {
  it('reads a stored video', () => {
    expect(noteYoutubeFromDoc(yt)).toEqual(yt)
    expect(noteYoutubeFromDoc({ ...yt, status: 'public', publishedAt: NOW })).toEqual({ ...yt, status: 'public', publishedAt: NOW })
  })
  it('drops missing or malformed values', () => {
    expect(noteYoutubeFromDoc(undefined)).toBeUndefined()
    expect(noteYoutubeFromDoc({ ...yt, status: 'listed' })).toBeUndefined()
    expect(noteYoutubeFromDoc({ ...yt, id: '<script>' })).toBeUndefined()
    expect(noteYoutubeFromDoc('KnHYipswKUs')).toBeUndefined()
  })
})

describe('youtube on the note record', () => {
  it('is never taken from input', () => {
    expect(normalizeNote({ ...input, youtube: yt }, { now: NOW }).youtube).toBeUndefined()
  })
  it('survives an edit, since the store writes the whole document', () => {
    const existing = note({ youtube: yt })
    expect(normalizeNote({ ...input, title: 'Edited title?' }, { now: NOW, existing }).youtube).toEqual(yt)
  })
  it('is read from Firestore and kept out of the index metadata', () => {
    const fromDoc = noteFromDoc({ ...note(), youtube: yt }, 'node-hang')!
    expect(fromDoc.youtube).toEqual(yt)
    expect(toNoteMeta(fromDoc)).not.toHaveProperty('youtube')
    expect(toNoteMeta(fromDoc)).not.toHaveProperty('markdown')
    expect(noteFromDoc({ ...note() }, 'node-hang')).not.toHaveProperty('youtube')
  })
})

describe('publicVideo', () => {
  it('is null until the video is public', () => {
    expect(publicVideo(note())).toBeNull()
    expect(publicVideo(note({ youtube: yt }))).toBeNull()
    expect(publicVideo(note({ youtube: { ...yt, status: 'gone' } }))).toBeNull()
  })
  it('dates the VideoObject by the publish time, falling back to the upload', () => {
    expect(publicVideo(note({ youtube: { ...yt, status: 'public', publishedAt: NOW } }))).toEqual({ id: yt.id, uploadDate: NOW })
    expect(publicVideo(note({ youtube: { ...yt, status: 'public' } }))).toEqual({ id: yt.id, uploadDate: yt.uploadedAt })
  })
})

describe('isFirstPublish', () => {
  const draft = note({ published: false })
  it('fires for a new note saved as published, or a draft going live', () => {
    expect(isFirstPublish(note(), null)).toBe(true)
    expect(isFirstPublish(note(), draft)).toBe(true)
  })
  it('does not fire for drafts, edits of live notes, or notes that already have a video', () => {
    expect(isFirstPublish(draft, null)).toBe(false)
    expect(isFirstPublish(note(), note())).toBe(false)
    expect(isFirstPublish(note({ youtube: yt }), note({ published: false, youtube: yt }))).toBe(false)
  })
})

describe('shorts job request', () => {
  it('targets the Cloud Run job and overrides its args with one slug', () => {
    expect(shortsJobRunUrl('xploit-games')).toBe(`https://run.googleapis.com/v2/projects/xploit-games/locations/${SHORTS_JOB.region}/jobs/${SHORTS_JOB.name}:run`)
    expect(runShortBody('node-hang')).toEqual({ overrides: { containerOverrides: [{ args: ['run-short', 'node-hang'] }] } })
  })
})
