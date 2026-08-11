import type { BlogPostMeta, BlogPostRecord } from '~~/utils/blog-post'
import { recordFromDoc, sortByCreatedDesc, toMeta } from '~~/utils/blog-post'
import { getDb } from './firebase-admin'
import { reportServerEvent } from './report-error'

/**
 * Firestore access for blog posts.
 *
 * Two collections:
 *
 * - `blog_posts/{slug}` — one document per post, including its markdown. The
 *   source of truth.
 * - `blog_index/current` — a single document holding every post's metadata
 *   without the body.
 *
 * The index document exists for read cost. The post list is needed by /blogs,
 * every /categories page, the home page, the RSS feed, the sitemap and both
 * llms routes; fetching 30+ documents on each cache miss would burn through the
 * Firestore daily read quota for no benefit, whereas the index is one read. It
 * is rewritten on every save and can be rebuilt from the collection at any time
 * via `rebuildIndex()`.
 */

export const BLOG_POSTS_COLLECTION = 'blog_posts'
export const BLOG_INDEX_COLLECTION = 'blog_index'
export const BLOG_INDEX_DOC = 'current'

const postsCollection = () => getDb().collection(BLOG_POSTS_COLLECTION)
const indexDoc = () => getDb().collection(BLOG_INDEX_COLLECTION).doc(BLOG_INDEX_DOC)

// Module-level memo of the index. The TTL is the publish-to-visible latency
// floor, and it is deliberately shorter than the CDN's s-maxage on /blogs/**.
const INDEX_TTL_MS = 60_000

interface IndexMemo {
  posts: BlogPostMeta[]
  fetchedAt: number
}

let memo: IndexMemo | null = null

function metaFromIndexEntry(entry: unknown): BlogPostMeta | null {
  if (!entry || typeof entry !== 'object')
    return null
  const data = entry as Record<string, unknown>
  const slug = typeof data.slug === 'string' ? data.slug : ''
  if (!slug)
    return null
  const record = recordFromDoc(data, slug)
  return record ? toMeta(record) : null
}

async function fetchIndex(): Promise<BlogPostMeta[]> {
  const snap = await indexDoc().get()
  const raw = snap.exists ? snap.data()?.posts : null
  if (!Array.isArray(raw))
    return []
  return sortByCreatedDesc(raw.map(metaFromIndexEntry).filter((p): p is BlogPostMeta => !!p))
}

export interface ListOptions {
  /** Drafts are excluded everywhere except the studio. */
  publishedOnly?: boolean
  /** Skip the memo — used right after a write so the studio sees its own edit. */
  fresh?: boolean
}

/**
 * Post metadata, newest first.
 *
 * Fails open: if Firestore is unreachable the last good memo is served stale
 * rather than 500ing the whole blog, matching the GitHub release route.
 */
export async function listMeta(opts: ListOptions = {}): Promise<BlogPostMeta[]> {
  const now = Date.now()
  const usable = memo && !opts.fresh && now - memo.fetchedAt < INDEX_TTL_MS

  if (!usable) {
    try {
      memo = { posts: await fetchIndex(), fetchedAt: now }
    }
    catch (err) {
      reportServerEvent('ERROR', 'Blog index read failed', { kind: 'blog-index', detail: String(err) })
      if (!memo)
        throw err
      // Keep serving the stale copy; the next request retries.
    }
  }

  const posts = memo?.posts ?? []
  return opts.publishedOnly ? posts.filter(p => p.published) : posts
}

/** A single post including its markdown, or null when it does not exist. */
export async function getPost(slug: string): Promise<BlogPostRecord | null> {
  const snap = await postsCollection().doc(slug).get()
  if (!snap.exists)
    return null
  return recordFromDoc(snap.data() as Record<string, unknown>, slug)
}

/** Every post document. Only for the index rebuild — the list path uses `listMeta`. */
export async function getAllPosts(): Promise<BlogPostRecord[]> {
  const snap = await postsCollection().get()
  return snap.docs
    .map(doc => recordFromDoc(doc.data() as Record<string, unknown>, doc.id))
    .filter((p): p is BlogPostRecord => !!p)
}

/**
 * Rewrite the index from the post collection. Also the repair route for any
 * drift between the two.
 */
export async function rebuildIndex(): Promise<BlogPostMeta[]> {
  const posts = sortByCreatedDesc(await getAllPosts()).map(toMeta)
  await indexDoc().set({ posts, updatedAt: new Date().toISOString() })
  memo = { posts, fetchedAt: Date.now() }
  return posts
}

export async function savePost(record: BlogPostRecord): Promise<void> {
  await postsCollection().doc(record.slug).set(record)
  await rebuildIndex()
}

/**
 * Writes many posts in one batch and reindexes once. Used by the migration —
 * calling `savePost` in a loop would rebuild the index after every document.
 */
export async function savePosts(records: BlogPostRecord[]): Promise<void> {
  if (!records.length)
    return
  const batch = getDb().batch()
  for (const record of records)
    batch.set(postsCollection().doc(record.slug), record)
  await batch.commit()
  await rebuildIndex()
}

export async function deletePost(slug: string): Promise<void> {
  await postsCollection().doc(slug).delete()
  await rebuildIndex()
}

/** Drops the in-process memo. The other instance still waits out its TTL. */
export function clearIndexMemo(): void {
  memo = null
}
