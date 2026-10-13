import { recordFromDoc, sortByCreatedDesc, toMeta } from '~~/utils/blog-post'
import { createIndexedStore } from './indexed-store'

/**
 * Firestore access for blog posts: `blog_posts/{slug}` plus the metadata index
 * `blog_index/current`. The memo, stale fallback and index patching live in
 * `createIndexedStore` (server/utils/indexed-store.ts), shared with TIL notes.
 */

const store = createIndexedStore({
  collection: 'blog_posts',
  indexCollection: 'blog_index',
  indexField: 'posts',
  label: 'Blog',
  fromDoc: recordFromDoc,
  toMeta,
  sort: sortByCreatedDesc,
})

/** Post metadata, newest first. Serves the last good copy if Firestore fails. */
export const listMeta = store.list
/** A single post including its markdown, or null when it does not exist. */
export const getPost = store.get
/** Several posts in one round trip, in the order given. Missing ones are skipped. */
export const getPosts = store.getMany
/** Rewrites the index from the collection; the repair route for any drift. */
export const rebuildIndex = store.rebuild
export const savePost = store.save
export const deletePost = store.remove
