// Explicit import: the auto-imported `queryCollection` resolves to the app-side
// 1-arg composable in the IDE's type context; the server variant takes (event, collection).
import { queryCollection } from '@nuxt/content/server'
import { listMeta } from '../utils/blog-store'
import {
  abs,
  llmsHeader,
  llmsMainPages,
  llmsOptional,
  llmsProjects,
  llmsServices,
  llmsTools,
} from '../utils/llms'

/**
 * /llms.txt — the llmstxt.org descriptor, generated rather than hand-written.
 *
 * The previous version was a static file in public/. It passed the format check
 * but listed none of the 31 posts and had to be edited by hand every time a tool
 * or service was added. Everything here comes from the same registries the site
 * renders from (`publicServices`, `OFFERINGS`), from the blog index in Firestore
 * and from the content DB (docs), so it cannot drift.
 *
 * Posts marked `noindex` are excluded for the same reason they are excluded from
 * the sitemap: they are too thin to be worth an agent's context budget.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400')

  const posts = await listMeta({ publishedOnly: true })

  const docs = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/docs/%')
    .select('path', 'title')
    .all()

  const indexable = posts.filter(p => !p.noindex)

  const writing = [
    '## Writing',
    '',
    `${indexable.length} posts, newest first. Each entry is title, URL, then the post's own summary.`,
    '',
    ...indexable.map((post) => {
      const date = post.createdAt ? ` (${String(post.createdAt).slice(0, 10)})` : ''
      const tags = (post.tags ?? []).length ? ` Tags: ${(post.tags ?? []).join(', ')}.` : ''
      return `- [${post.title}](${abs(post.path)})${date}: ${post.description ?? ''}${tags}`
    }),
  ].join('\n')

  return [
    llmsHeader(),
    llmsMainPages(),
    llmsTools(),
    llmsServices(),
    writing,
    llmsProjects(),
    llmsOptional(docs.map(d => ({ path: d.path, title: d.title ?? d.path }))),
  ].join('\n\n')
})
