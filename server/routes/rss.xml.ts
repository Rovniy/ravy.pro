import { Feed } from 'feed'
import { baseData, homePage, navbarData } from '~/data'
import { renderMarkdown } from '../utils/blog-render'
import { getPosts, listMeta } from '../utils/blog-store'
import { mdcToHtml } from '../utils/mdc-html'

// Cached in-process as well as at the CDN: each of the two instances would
// otherwise re-read and re-render every post on its own CDN misses.
export default defineCachedEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  // The feed only changes when a post is published/edited — let the CDN
  // serve it and refresh in the background instead of hitting the DB on
  // every poll from feed readers.
  setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')

  const index = await listMeta({ publishedOnly: true })
  const docs = await getPosts(index.map(meta => meta.slug))

  const feed = new Feed({
    title: navbarData.homeTitle,
    description: homePage.meta.description,
    id: baseData.site.url,
    link: baseData.site.url,
    language: 'en',
    favicon: `${baseData.site.url}/favicon.ico`,
    copyright: baseData.site.licence,
    author: {
      name: baseData.me.name,
      email: baseData.me.email,
      link: baseData.site.url,
    },
  })

  for (const doc of docs) {
    const body = await renderMarkdown(doc.markdown)
    const html = mdcToHtml(body, baseData.site.url)
    feed.addItem({
      title: `${baseData.me.name} | ${doc.title}`,
      id: baseData.site.url + doc.path,
      link: baseData.site.url + doc.path,
      description: doc.description,
      content: html || doc.description,
      date: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      category: doc.tags.map(tag => ({ name: tag })),
    })
  }

  return feed.rss2()
}, { name: 'rss-blog', maxAge: 3600, swr: true })
