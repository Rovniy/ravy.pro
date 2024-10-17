import { Feed } from 'feed'
import { serverQueryContent } from '#content/server'
import { baseData, homePage, navbarData } from '~/data'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/xml')

  const docs = await serverQueryContent(event).sort({ date: -1 }).find()

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

  // Add the feed items
  docs.forEach((doc) => {
    feed.addItem({
      title: doc.title || '',
      id: baseData.site.url + doc._path,
      link: baseData.site.url + doc._path,
      description: doc.description,
      content: doc.description,
      date: new Date(doc.date),
    })
  })

  return feed.rss2()
})
