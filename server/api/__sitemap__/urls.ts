// Explicit import: the auto-imported `queryCollection` resolves to the app-side
// 1-arg composable in the IDE's type context; the server variant takes (event, collection).
import { queryCollection } from '@nuxt/content/server'
import { listMeta } from '~~/server/utils/blog-store'
import { publicServices, seoData } from '~/data'
import { OFFERING_PAGE_PATHS } from '~/data/offerings'

export default defineEventHandler(async (event) => {
  const posts = await listMeta({ publishedOnly: true })

  const docs = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/docs/%')
    .select('path', 'lastUpdated', 'createdAt')
    .all()

  const urls: {
    loc: string
    lastmod?: string
    images?: { loc: string, title?: string, caption?: string }[]
  }[] = []

  // The tools hub. Listed explicitly rather than relying on prerender
  // auto-discovery so it can't quietly fall out of the sitemap.
  urls.push({ loc: '/tools' })

  // The sitemap module auto-includes prerendered routes, which is how these
  // three used to get in. They render per request now that the post list is
  // live, so without this the home page would drop out of the sitemap.
  urls.push({ loc: '/' })
  urls.push({ loc: '/blogs' })
  urls.push({ loc: '/categories' })

  // Public tools come from the single source of truth (data/index.ts). Gated
  // tools live in GATED_TOOLS (data/services.ts) and are intentionally excluded.
  for (const tool of publicServices) {
    urls.push({ loc: tool.path })
  }

  // Docs carry a real `lastUpdated` in frontmatter, which is more truthful than
  // the build timestamp `autoLastmod` would otherwise supply.
  for (const doc of docs) {
    urls.push({
      loc: doc.path,
      lastmod: doc.lastUpdated || doc.createdAt || undefined,
    })
  }

  // /now lives in content/pages with a real `lastUpdated` in frontmatter —
  // query it so the sitemap reflects the actual edit date (the freshness date
  // is the whole point of a now page) rather than the build timestamp.
  const nowDoc = await queryCollection(event, 'content')
    .where('path', '=', '/pages/now')
    .select('lastUpdated', 'createdAt')
    .first()
  urls.push({ loc: '/now', lastmod: nowDoc?.lastUpdated || nowDoc?.createdAt || undefined })

  // Commercial offerings: the index, plus any offering with its own landing
  // page. Derived from OFFERING_PAGE_PATHS, so promoting an offering to a full
  // page needs no edit here.
  urls.push({ loc: '/services' })
  for (const path of OFFERING_PAGE_PATHS) {
    urls.push({ loc: path })
  }

  const tagSet = new Set<string>()

  for (const post of posts) {
    // Tags still feed the category hubs even for a non-indexable post — the
    // category page itself stays indexable and the post stays linked from it.
    for (const tag of (post.tags ?? [])) tagSet.add(tag)

    // `noindex` posts emit the matching meta on the page, so listing them here
    // would ask Google to crawl a URL we've told it not to index.
    if (post.noindex)
      continue

    const imgPath = post.ogImage || post.image
    const images = imgPath
      ? [{ loc: imgPath.startsWith('http') ? imgPath : `${seoData.mySite}${imgPath}`, title: post.title ?? undefined, caption: post.description ?? undefined }]
      : undefined

    urls.push({
      loc: post.path,
      lastmod: post.lastUpdated || post.createdAt || undefined,
      ...(images && { images }),
    })
  }

  for (const tag of tagSet) {
    urls.push({ loc: `/categories/${tag}` })
  }

  return urls
})
