import { baseData } from '~/data'
import { getPost, listMeta } from '../utils/blog-store'
import { abs, absolutizeMarkdown, llmsHeader } from '../utils/llms'
import { getNotes, listNotes } from '../utils/til-store'

/**
 * /llms-full.txt — every post's full text as one Markdown document.
 *
 * The site had no machine-readable route to its own prose. An agent that wanted
 * the content had to crawl 31 HTML pages and strip the chrome, or stumble onto
 * the undocumented `_payload.json` files. This is the same text, once, in the
 * format a model reads most cheaply.
 *
 * Since posts are stored as markdown, this route serves the stored source
 * directly — no AST round-trip, which is what `minimarkToMarkdown` used to do.
 *
 * Posts marked `noindex` are excluded, matching /llms.txt and the sitemap.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')

  const index = (await listMeta({ publishedOnly: true })).filter(post => !post.noindex)

  // One document read per post. The route is CDN-cached for an hour and hit by
  // crawlers rather than readers, so the cost is a handful of reads a day.
  const posts = await Promise.all(index.map(meta => getPost(meta.slug)))

  const sections = posts
    .filter((post): post is NonNullable<typeof post> => !!post)
    .map((post) => {
      const meta = [
        `URL: ${abs(post.path)}`,
        post.createdAt ? `Published: ${String(post.createdAt).slice(0, 10)}` : null,
        post.tags.length ? `Tags: ${post.tags.join(', ')}` : null,
        `Author: ${baseData.me.name}`,
      ].filter(Boolean).join(' · ')

      return [
        `# ${post.title}`,
        meta,
        post.description ? `> ${post.description}` : null,
        absolutizeMarkdown(post.markdown.trim()),
      ].filter(Boolean).join('\n\n')
    })

  const noteIndex = await listNotes({ publishedOnly: true }).catch(() => [])
  const notes = (await getNotes(noteIndex.map(n => n.slug)).catch(() => []))
    .filter(n => n.published)
    .map(note => [
      `# TIL: ${note.title}`,
      `URL: ${abs(note.path)} · Published: ${note.createdAt.slice(0, 10)} · Author: ${baseData.me.name}`,
      absolutizeMarkdown(note.markdown.trim()),
    ].join('\n\n'))

  return [
    llmsHeader(),
    `This file contains the full text of ${sections.length} posts and ${notes.length} short TIL notes, newest first, separated by horizontal rules. The index with per-post summaries is at ${abs('/llms.txt')}.`,
    ...sections,
    ...notes,
  ].join('\n\n---\n\n')
})
