import type { TilNoteRecord } from '~~/utils/til'
import { isFirstPublish, normalizeNote, notePingPaths } from '~~/utils/til'
import { pingIndexNow } from './indexnow'
import { enqueueShort } from './shorts'
import { getNote, saveNote } from './til-store'

/**
 * Stores a validated note and, when the change is visible on the site (it is
 * live, or it just stopped being live), tells the IndexNow engines. A note's
 * first publish also starts the YouTube Shorts bot. The studio route and the
 * MCP tools both save through here.
 */
export async function persistNote(note: TilNoteRecord, existing: TilNoteRecord | null): Promise<void> {
  await saveNote(note)
  if (note.published || existing?.published)
    await pingIndexNow(notePingPaths(note))
  if (isFirstPublish(note, existing))
    await enqueueShort(note.slug)
}

/**
 * Publishes a stored draft as it is, through the same normalize → persist path
 * as the studio's PUT, so a publish from Telegram fires the same hooks once.
 * Throws `TilNoteValidationError` if the stored note no longer validates.
 */
export async function publishStoredNote(slug: string): Promise<'missing' | 'already' | 'published'> {
  const existing = await getNote(slug)
  if (!existing)
    return 'missing'
  if (existing.published)
    return 'already'
  const note = normalizeNote({ ...existing, published: true }, { now: new Date().toISOString(), existing })
  await persistNote(note, existing)
  return 'published'
}
