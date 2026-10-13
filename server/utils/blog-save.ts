import type { BlogPostRecord } from '~~/utils/blog-post'
import { savePost } from './blog-store'
import { pingIndexNow } from './indexnow'

/**
 * Stores a validated post and, when the change is visible on the site (it is
 * live, or it just stopped being live), tells the IndexNow engines. The studio
 * route and the MCP tools both save through here, like `persistNote` for TIL.
 */
export async function persistPost(record: BlogPostRecord, existing: BlogPostRecord | null): Promise<void> {
  await savePost(record)
  if (record.published || existing?.published)
    await pingIndexNow([record.path, '/blogs', ...record.tags.map(t => `/categories/${t}`)])
}
