import { noteFromDoc, sortNotes, toNoteMeta } from '~~/utils/til'
import { createIndexedStore } from './indexed-store'

/**
 * Firestore access for TIL notes: `til_notes/{slug}` plus the metadata index
 * `til_index/current`, built on the same `createIndexedStore` as the blog.
 */

const store = createIndexedStore({
  collection: 'til_notes',
  indexCollection: 'til_index',
  indexField: 'notes',
  label: 'TIL',
  fromDoc: noteFromDoc,
  toMeta: toNoteMeta,
  sort: sortNotes,
})

export const listNotes = store.list
export const getNote = store.get
/** Several notes in one round trip, in the order given. Missing ones are skipped. */
export const getNotes = store.getMany
export const rebuildNoteIndex = store.rebuild
export const saveNote = store.save
export const deleteNote = store.remove
