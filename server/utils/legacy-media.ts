import { getDb } from './firebase-admin'
import { reportServerEvent } from './report-error'

/**
 * Old → new URL map for the blog assets that moved from `public/` into Cloud
 * Storage.
 *
 * Those paths are indexed by Google Images, listed as `<image:loc>` in the
 * sitemap, and one of them (a presentation PDF) is linked from /links. Deleting
 * the folders without this map would 404 every one of them, so the import
 * records where each file went and `server/routes/blog-*` 301s to it.
 *
 * One document, because the whole map is ~140 short strings and every lookup
 * wants all of it.
 */

const COLLECTION = 'blog_media'
const DOC = 'redirects'

// Lookups only happen for URLs that no longer exist, i.e. crawlers and old
// links. An hour is plenty, and the map only ever grows.
const TTL_MS = 60 * 60 * 1000

type MediaMap = Record<string, string>

interface Memo {
  map: MediaMap
  fetchedAt: number
}

let memo: Memo | null = null

const doc = () => getDb().collection(COLLECTION).doc(DOC)

function sanitizeMap(raw: unknown): MediaMap {
  if (!raw || typeof raw !== 'object')
    return {}
  const out: MediaMap = {}
  for (const [from, to] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof to === 'string' && from.startsWith('/') && to.startsWith('/'))
      out[from] = to
  }
  return out
}

export async function getLegacyMediaMap(fresh = false): Promise<MediaMap> {
  const now = Date.now()
  if (!fresh && memo && now - memo.fetchedAt < TTL_MS)
    return memo.map

  try {
    const snap = await doc().get()
    memo = { map: sanitizeMap(snap.exists ? snap.data()?.map : null), fetchedAt: now }
  }
  catch (err) {
    reportServerEvent('WARNING', 'Legacy media map read failed', { kind: 'legacy-media', detail: String(err) })
    // A missing map means a 404 for an old asset URL, not a broken page.
    if (!memo)
      return {}
  }

  return memo?.map ?? {}
}

/**
 * Adds entries without touching existing ones.
 *
 * Merge rather than replace so a second import run cannot repoint URLs that
 * were already published under their new location.
 */
export async function addLegacyMediaEntries(entries: MediaMap): Promise<number> {
  const current = await getLegacyMediaMap(true)
  const merged = { ...current }
  let added = 0
  for (const [from, to] of Object.entries(entries)) {
    if (!(from in merged)) {
      merged[from] = to
      added++
    }
  }
  if (added)
    await doc().set({ map: merged, updatedAt: new Date().toISOString() })
  memo = { map: merged, fetchedAt: Date.now() }
  return added
}
