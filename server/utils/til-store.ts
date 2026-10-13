import type { TilNoteMeta, TilNoteRecord } from '~~/utils/til'
import { noteFromDoc, sortNotes, toNoteMeta } from '~~/utils/til'
import { getDb } from './firebase-admin'
import { reportServerEvent } from './report-error'

/**
 * Firestore access for TIL notes, built exactly like `blog-store.ts`:
 *
 * - `til_notes/{slug}`: one note, with its markdown. The source of truth.
 * - `til_index/current`: every note's metadata in one document, so /til, the
 *   topic hubs, the sitemap, RSS and llms cost one read per cache miss.
 *
 * The memo serves a stale copy when Firestore fails, rather than 500ing /til.
 */

export const TIL_NOTES_COLLECTION = 'til_notes'
export const TIL_INDEX_COLLECTION = 'til_index'
const INDEX_DOC = 'current'
const INDEX_TTL_MS = 60_000

const notesCollection = () => getDb().collection(TIL_NOTES_COLLECTION)
const indexDoc = () => getDb().collection(TIL_INDEX_COLLECTION).doc(INDEX_DOC)

let memo: { notes: TilNoteMeta[], fetchedAt: number } | null = null

async function fetchIndex(): Promise<TilNoteMeta[]> {
  const snap = await indexDoc().get()
  const raw = snap.exists ? snap.data()?.notes : null
  if (!Array.isArray(raw))
    return []
  const notes = raw
    .map((entry) => {
      const data = entry && typeof entry === 'object' ? entry as Record<string, unknown> : null
      const slug = typeof data?.slug === 'string' ? data.slug : ''
      const note = slug ? noteFromDoc(data!, slug) : null
      return note ? toNoteMeta(note) : null
    })
    .filter((n): n is TilNoteMeta => !!n)
  return sortNotes(notes)
}

export async function listNotes(opts: { publishedOnly?: boolean, fresh?: boolean } = {}): Promise<TilNoteMeta[]> {
  const now = Date.now()
  if (!memo || opts.fresh || now - memo.fetchedAt >= INDEX_TTL_MS) {
    try {
      memo = { notes: await fetchIndex(), fetchedAt: now }
    }
    catch (err) {
      reportServerEvent('ERROR', 'TIL index read failed', { kind: 'til-index', detail: String(err) })
      if (!memo)
        throw err
    }
  }
  const notes = memo?.notes ?? []
  return opts.publishedOnly ? notes.filter(n => n.published) : notes
}

export async function getNote(slug: string): Promise<TilNoteRecord | null> {
  const snap = await notesCollection().doc(slug).get()
  return snap.exists ? noteFromDoc(snap.data() as Record<string, unknown>, slug) : null
}

/** Several notes in one round trip, in the order given. Missing ones are skipped. */
export async function getNotes(slugs: string[]): Promise<TilNoteRecord[]> {
  if (!slugs.length)
    return []
  const snaps = await getDb().getAll(...slugs.map(s => notesCollection().doc(s)))
  return snaps
    .map(snap => snap.exists ? noteFromDoc(snap.data() as Record<string, unknown>, snap.id) : null)
    .filter((n): n is TilNoteRecord => !!n)
}

export async function rebuildNoteIndex(): Promise<TilNoteMeta[]> {
  const snap = await notesCollection().get()
  const notes = sortNotes(snap.docs
    .map(doc => noteFromDoc(doc.data() as Record<string, unknown>, doc.id))
    .filter((n): n is TilNoteRecord => !!n)
    .map(toNoteMeta))
  await indexDoc().set({ notes, updatedAt: new Date().toISOString() })
  memo = { notes, fetchedAt: Date.now() }
  return notes
}

export async function saveNote(note: TilNoteRecord): Promise<void> {
  await notesCollection().doc(note.slug).set(note)
  await rebuildNoteIndex()
}

export async function deleteNote(slug: string): Promise<void> {
  await notesCollection().doc(slug).delete()
  await rebuildNoteIndex()
}
