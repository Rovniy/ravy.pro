import { Feed } from 'feed'
import { baseData, homePage, navbarData } from '~/data'
import { minimarkToHtml } from '../utils/minimark-html'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  // The feed only changes when a post is published/edited — let the CDN
  // serve it and refresh in the background instead of hitting the DB on
  // every poll from feed readers.
  setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')

  const docs = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .order('createdAt', 'DESC')
    .all()

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

  docs.forEach((doc) => {
    const html = minimarkToHtml(doc.body, baseData.site.url)
    feed.addItem({
      title: `${baseData.me.name} | ${doc.title}`,
      id: baseData.site.url + doc.path,
      link: baseData.site.url + doc.path,
      description: doc.description,
      content: html || doc.description,
      date: doc.createdAt ? new Date(doc.createdAt) : new Date(),
      category: (doc.tags ?? []).map((tag: string) => ({ name: tag })),
    })
  })

  return feed.rss2()
})
