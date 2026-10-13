import type { TilNoteMeta, TilNoteRecord } from '~/utils/til'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

export type SavedNote = TilNoteRecord & { warnings: string[] }

/** Client for the studio's TIL note routes. The preview reuses the post preview route. */
export function useTilStudio() {
  const { authedFetch } = useAuthedFetch()

  return {
    listNotes: () => authedFetch<TilNoteMeta[]>('/api/til/admin/notes'),
    getNote: (slug: string) => authedFetch<SavedNote>(`/api/til/admin/note/${slug}`),
    saveNote: (note: Partial<TilNoteRecord> & { slug: string }, mode: 'create' | 'update') =>
      authedFetch<SavedNote>('/api/til/admin/note', { method: 'PUT', body: JSON.stringify({ ...note, mode }) }),
    deleteNote: (slug: string) => authedFetch<{ ok: boolean }>(`/api/til/admin/note/${slug}`, { method: 'DELETE' }),
  }
}
