import { getDb } from './firebase-admin'
import { reportServerEvent } from './report-error'

/**
 * A Firestore collection plus a single index document holding every item's
 * metadata. The blog and TIL stores are both built from this.
 *
 * - `<collection>/{slug}` — one document per item, including its markdown. The
 *   source of truth.
 * - `<indexCollection>/current` — `{ [indexField]: Meta[] }`, every item without
 *   its body.
 *
 * The index exists for read cost: the lists (pages, RSS, sitemap, llms) need
 * every item's metadata, and one document is one read where 30+ would burn the
 * free-tier quota. It is memoised for `INDEX_TTL_MS` and serves the stale copy
 * when Firestore fails, rather than 500ing every list page.
 *
 * A save or delete patches the one index entry inside the same transaction as
 * the document write — 1 read, 2 writes — instead of re-reading the collection.
 * `rebuild()` re-derives the index from the collection; it is the fallback when
 * the index document is missing and the repair route for any drift.
 */

const INDEX_DOC = 'current'

/** The publish-to-visible floor. Shorter than the CDN's s-maxage on the pages. */
export const INDEX_TTL_MS = 60_000

export interface IndexedStoreOptions<R extends { slug: string }, M extends { slug: string }> {
  collection: string
  indexCollection: string
  /** Array field on the index document: `posts`, `notes`. */
  indexField: string
  /** Prefix for log messages: 'Blog', 'TIL'. */
  label: string
  /** Validates and normalises raw document data; null drops it. */
  fromDoc: (data: Record<string, unknown> | undefined, slug: string) => R | null
  toMeta: (record: R) => M
  sort: (items: M[]) => M[]
}

export interface ListOptions {
  /** Drafts are excluded everywhere except the studio. */
  publishedOnly?: boolean
  /** Skip the memo — used right after a write so the studio sees its own edit. */
  fresh?: boolean
}

export function createIndexedStore<R extends { slug: string }, M extends { slug: string, published: boolean }>(
  opts: IndexedStoreOptions<R, M>,
) {
  const items = () => getDb().collection(opts.collection)
  const indexDoc = () => getDb().collection(opts.indexCollection).doc(INDEX_DOC)

  let memo: { items: M[], fetchedAt: number } | null = null

  function parseIndex(raw: unknown): M[] | null {
    if (!Array.isArray(raw))
      return null
    const parsed = raw.map((entry) => {
      const data = entry && typeof entry === 'object' ? entry as Record<string, unknown> : null
      const slug = typeof data?.slug === 'string' ? data.slug : ''
      const record = slug ? opts.fromDoc(data!, slug) : null
      return record ? opts.toMeta(record) : null
    })
    return opts.sort(parsed.filter((m): m is M => !!m))
  }

  function writeIndex(list: M[]) {
    return { [opts.indexField]: list, updatedAt: new Date().toISOString() }
  }

  async function list(listOpts: ListOptions = {}): Promise<M[]> {
    const now = Date.now()
    if (!memo || listOpts.fresh || now - memo.fetchedAt >= INDEX_TTL_MS) {
      try {
        const snap = await indexDoc().get()
        memo = { items: parseIndex(snap.exists ? snap.data()?.[opts.indexField] : null) ?? [], fetchedAt: now }
      }
      catch (err) {
        reportServerEvent('ERROR', `${opts.label} index read failed`, { kind: `${opts.label.toLowerCase()}-index`, detail: String(err) })
        if (!memo)
          throw err
        // Keep serving the stale copy; the next request retries.
      }
    }
    const all = memo?.items ?? []
    return listOpts.publishedOnly ? all.filter(m => m.published) : all
  }

  /** One item including its markdown, or null when it does not exist. */
  async function get(slug: string): Promise<R | null> {
    const snap = await items().doc(slug).get()
    return snap.exists ? opts.fromDoc(snap.data() as Record<string, unknown>, slug) : null
  }

  /** Several items in one round trip, in the order given. Missing ones are skipped. */
  async function getMany(slugs: string[]): Promise<R[]> {
    if (!slugs.length)
      return []
    const snaps = await getDb().getAll(...slugs.map(s => items().doc(s)))
    return snaps
      .map(snap => snap.exists ? opts.fromDoc(snap.data() as Record<string, unknown>, snap.id) : null)
      .filter((r): r is R => !!r)
  }

  async function rebuild(): Promise<M[]> {
    const snap = await items().get()
    const all = opts.sort(snap.docs
      .map(doc => opts.fromDoc(doc.data() as Record<string, unknown>, doc.id))
      .filter((r): r is R => !!r)
      .map(opts.toMeta))
    await indexDoc().set(writeIndex(all))
    memo = { items: all, fetchedAt: Date.now() }
    return all
  }

  /**
   * Writes the document and patches its index entry atomically. With no index
   * document yet there is nothing to patch, so the index is built from the
   * collection instead — which already includes the item just written.
   */
  async function patch(slug: string, record: R | null): Promise<void> {
    const indexRef = indexDoc()
    const docRef = items().doc(slug)
    const patched = await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(indexRef)
      const current = snap.exists ? parseIndex(snap.data()?.[opts.indexField]) : null
      if (record)
        tx.set(docRef, record)
      else
        tx.delete(docRef)
      if (!current)
        return null
      const next = current.filter(m => m.slug !== slug)
      if (record)
        next.push(opts.toMeta(record))
      const sorted = opts.sort(next)
      tx.set(indexRef, writeIndex(sorted))
      return sorted
    })
    if (patched)
      memo = { items: patched, fetchedAt: Date.now() }
    else
      await rebuild()
  }

  return {
    list,
    get,
    getMany,
    rebuild,
    save: (record: R) => patch(record.slug, record),
    remove: (slug: string) => patch(slug, null),
  }
}
