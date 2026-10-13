import type { TilNoteRecord } from '~~/utils/til'
import { notePingPaths } from '~~/utils/til'
import { pingIndexNow } from './indexnow'
import { saveNote } from './til-store'

/**
 * Stores a validated note and, when the change is visible on the site (it is
 * live, or it just stopped being live), tells the IndexNow engines. The studio
 * route and the MCP tools both save through here.
 */
export async function persistNote(note: TilNoteRecord, existing: TilNoteRecord | null): Promise<void> {
  await saveNote(note)
  if (note.published || existing?.published)
    await pingIndexNow(notePingPaths(note))
}
