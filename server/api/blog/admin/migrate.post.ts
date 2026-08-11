import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { queryCollection } from '@nuxt/content/server'
import { requireToolAccess } from '~~/server/utils/access'
import { rebuildIndex, savePosts } from '~~/server/utils/blog-store'
import { BlogPostValidationError, normalizeRecord, slugFromPath } from '~~/utils/blog-post'

/**
 * One-off import of `content/blogs/*.md` into Firestore.
 *
 * Dev only, and gated on top of that. It reads two sources because neither one
 * is sufficient:
 *
 * 1. The content collection gives the **exact path** @nuxt/content generated
 *    for each file plus all of its frontmatter. Those paths are live URLs and
 *    must not move, so they are copied rather than re-derived.
 * 2. The files themselves give the **raw markdown** — `queryCollection` only
 *    ever returns the parsed tree.
 *
 * Files are matched to documents by slug, after stripping the legacy numeric
 * filename prefix (`10011. steam-ai-…md` → `steam-ai-…`), which is the same
 * transformation @nuxt/content applied. Anything that fails to match aborts the
 * run: a silent partial import is worse than no import.
 */

const FRONTMATTER_RX = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/
const LEGACY_PREFIX_RX = /^\d+\.\s*/

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_RX, '').trim()
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/i, '').replace(LEGACY_PREFIX_RX, '').trim()
}

export default defineEventHandler(async (event) => {
  if (!import.meta.dev)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  await requireToolAccess(event, 'studio')

  const body = await readBody(event).catch(() => ({}))
  const dryRun = body?.dryRun !== false

  const dir = join(process.cwd(), 'content', 'blogs')
  const filenames = (await readdir(dir)).filter(name => name.toLowerCase().endsWith('.md'))

  const markdownBySlug = new Map<string, string>()
  for (const filename of filenames) {
    const source = await readFile(join(dir, filename), 'utf8')
    markdownBySlug.set(slugFromFilename(filename), stripFrontmatter(source))
  }

  const docs = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/blogs/%')
    .all()

  const errors: string[] = []
  const planned: { slug: string, path: string, title: string, bytes: number }[] = []
  const records = []

  for (const doc of docs) {
    const slug = slugFromPath(doc.path)
    const markdown = markdownBySlug.get(slug)
    if (!markdown) {
      errors.push(`No markdown file matched ${doc.path} (looked for slug "${slug}")`)
      continue
    }
    markdownBySlug.delete(slug)

    try {
      const record = normalizeRecord({
        ...doc,
        slug,
        markdown,
      }, { now: new Date().toISOString() })

      // normalizeRecord stamps `lastUpdated` with the save time, which is right
      // for an edit and wrong for an import — these dates are in the sitemap
      // and in `article:modified_time`.
      record.path = doc.path
      record.lastUpdated = String(doc.lastUpdated || doc.createdAt || record.createdAt)

      records.push(record)
      planned.push({ slug, path: record.path, title: record.title, bytes: markdown.length })
    }
    catch (err) {
      errors.push(err instanceof BlogPostValidationError
        ? `${doc.path}: ${err.message}`
        : `${doc.path}: ${String(err)}`)
    }
  }

  for (const orphan of markdownBySlug.keys())
    errors.push(`Markdown file "${orphan}" has no matching content document`)

  if (errors.length)
    return { ok: false, dryRun, wrote: 0, planned: planned.length, errors }

  if (dryRun)
    return { ok: true, dryRun: true, wrote: 0, planned: planned.length, posts: planned, errors }

  await savePosts(records)
  const index = await rebuildIndex()

  return { ok: true, dryRun: false, wrote: records.length, indexed: index.length, posts: planned, errors }
})
