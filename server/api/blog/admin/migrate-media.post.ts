import type { Buffer } from 'node:buffer'
import type { BlogPostRecord } from '~~/utils/blog-post'
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import process from 'node:process'
import { requireToolAccess } from '~~/server/utils/access'
import { putMedia } from '~~/server/utils/blog-media'
import { clearRenderCache } from '~~/server/utils/blog-render'
import { getAllPosts, rebuildIndex, savePosts } from '~~/server/utils/blog-store'
import { addLegacyMediaEntries, getLegacyMediaMap } from '~~/server/utils/legacy-media'
import { LEGACY_MEDIA_DIRS, legacyMediaName, mediaUrl, ORPHAN_MEDIA_FOLDER, typeForExtension } from '~~/utils/blog-media'

/**
 * One-off import of `public/blog-cover`, `public/blog-content` and
 * `public/blog-opengraph` into Cloud Storage, rewriting every reference in the
 * posts as it goes.
 *
 * Dev only and gated, like the post importer. Idempotent in both directions:
 *
 * - a file already present in the redirect map is skipped entirely, so a second
 *   run cannot repoint a URL that has already been published;
 * - object names are `<basename>-<sha256 of contents>.<ext>`, so re-uploading
 *   the same bytes is a no-op and the `immutable` cache header stays honest.
 *
 * Files a post references are filed under that post's slug. The rest — really
 * just the presentation PDF that /links points at — go to `blog/legacy/`.
 */

async function walk(dir: string, prefix: string): Promise<{ oldPath: string, absPath: string }[]> {
  const out: { oldPath: string, absPath: string }[] = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  }
  catch {
    // A folder that has already been deleted is the expected state after a
    // successful run, not an error.
    return out
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    const rel = posix.join(prefix, entry.name)
    if (entry.isDirectory())
      out.push(...await walk(abs, rel))
    else if (entry.isFile())
      out.push({ oldPath: `/${rel}`, absPath: abs })
  }
  return out
}

/** Longest first, so `/blog-content/a` can never eat `/blog-content/a-b`. */
function rewriteText(text: string, map: Record<string, string>): string {
  let out = text
  for (const from of Object.keys(map).sort((a, b) => b.length - a.length)) {
    if (out.includes(from))
      out = out.split(from).join(map[from])
  }
  return out
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await requireToolAccess(event, 'studio')

  const body = await readBody(event).catch(() => ({}))
  const dryRun = body?.dryRun !== false

  const publicDir = join(process.cwd(), 'public')
  const files: { oldPath: string, absPath: string }[] = []
  for (const dir of LEGACY_MEDIA_DIRS)
    files.push(...await walk(join(publicDir, dir), dir))

  const posts = await getAllPosts()
  // Sorted so the owner picked for a file shared by two posts is stable across
  // runs rather than dependent on Firestore's document order.
  const sorted = [...posts].sort((a, b) => a.slug.localeCompare(b.slug))

  const existingMap = await getLegacyMediaMap(true)
  const skipped: string[] = []
  const unsupported: string[] = []
  const newEntries: Record<string, string> = {}
  const uploads: { relativePath: string, bytes: Buffer, contentType: string }[] = []
  const planned: { from: string, to: string, owner: string, bytes: number }[] = []

  function ownerOf(oldPath: string): string {
    const post = sorted.find(p =>
      p.image === oldPath || p.ogImage === oldPath || p.markdown.includes(oldPath))
    return post?.slug ?? ORPHAN_MEDIA_FOLDER
  }

  for (const { oldPath, absPath } of files) {
    if (existingMap[oldPath]) {
      skipped.push(oldPath)
      continue
    }

    const contentType = typeForExtension(oldPath)
    if (!contentType) {
      unsupported.push(oldPath)
      continue
    }

    const bytes = await readFile(absPath)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 10)
    const owner = ownerOf(oldPath)
    const relativePath = `${owner}/${legacyMediaName(oldPath, hash)}`

    newEntries[oldPath] = mediaUrl(relativePath)
    uploads.push({ relativePath, bytes, contentType })
    planned.push({ from: oldPath, to: newEntries[oldPath], owner, bytes: bytes.length })
  }

  // The rewrite has to consider previously-mapped paths too: a post edited
  // between two runs could have picked a legacy URL back up.
  const rewriteMap = { ...existingMap, ...newEntries }

  const changed: BlogPostRecord[] = []
  for (const post of posts) {
    const image = rewriteMap[post.image] ?? post.image
    const ogImage = rewriteMap[post.ogImage] ?? post.ogImage
    const markdown = rewriteText(post.markdown, rewriteMap)
    if (image !== post.image || ogImage !== post.ogImage || markdown !== post.markdown)
      changed.push({ ...post, image, ogImage, markdown })
  }

  const report = {
    ok: true,
    dryRun,
    files: files.length,
    uploads: uploads.length,
    skipped: skipped.length,
    postsToRewrite: changed.map(p => p.slug),
    unsupported,
    planned,
  }

  if (dryRun)
    return report

  for (const upload of uploads)
    await putMedia(upload.relativePath, upload.bytes, upload.contentType)

  // Written before the posts are saved: an interrupted run then leaves a
  // resolvable redirect for every file already uploaded, rather than orphans.
  const added = await addLegacyMediaEntries(newEntries)

  if (changed.length) {
    await savePosts(changed)
    clearRenderCache()
  }
  else {
    await rebuildIndex()
  }

  return { ...report, redirectsAdded: added, rewrote: changed.length }
})
