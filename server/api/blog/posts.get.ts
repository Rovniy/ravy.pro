import { listMeta } from '~~/server/utils/blog-store'

/**
 * Published post metadata, newest first. Feeds /blogs, /categories/*, the home
 * page's "Recent Posts", and (server-side) the RSS feed, sitemap and llms
 * routes.
 *
 * The 60s CDN window is the publish-to-visible latency: Firebase App Hosting
 * has no on-demand purge, so the only lever is a short s-maxage.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600')
  return await listMeta({ publishedOnly: true })
})
