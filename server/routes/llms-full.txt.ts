// Explicit import: the auto-imported `queryCollection` resolves to the app-side
// 1-arg composable in the IDE's type context; the server variant takes (event, collection).
import { queryCollection } from '@nuxt/content/server'
import { baseData } from '~/data'
import { abs, llmsHeader } from '../utils/llms'
import { minimarkToMarkdown } from '../utils/minimark-markdown'

/**
 * /llms-full.txt — every post's full text as one Markdown document.
 *
 * The site had no machine-readable route to its own prose. An agent that wanted
 * the content had to crawl 31 HTML pages and strip the chrome, or stumble onto
 * the undocumented `_payload.json` files. This is the same text, once, in the
 * format a model reads most cheaply.
 *
 * Posts marked `noindex` are excluded, matching /llms.txt and the sitemap.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')

  const posts = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .order('createdAt', 'DESC')
    .all()

  const sections = posts
    .filter(post => !post.noindex)
    .map((post) => {
      const meta = [
        `URL: ${abs(post.path)}`,
        post.createdAt ? `Published: ${String(post.createdAt).slice(0, 10)}` : null,
        (post.tags ?? []).length ? `Tags: ${(post.tags ?? []).join(', ')}` : null,
        `Author: ${baseData.me.name}`,
      ].filter(Boolean).join(' · ')

      const body = minimarkToMarkdown(post.body, baseData.site.url)

      return [
        `# ${post.title}`,
        meta,
        post.description ? `> ${post.description}` : null,
        body,
      ].filter(Boolean).join('\n\n')
    })

  return [
    llmsHeader(),
    `This file contains the full text of ${sections.length} posts, newest first, separated by horizontal rules. The index with per-post summaries is at ${abs('/llms.txt')}.`,
    ...sections,
  ].join('\n\n---\n\n')
})
