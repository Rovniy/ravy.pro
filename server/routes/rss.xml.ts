import { Feed } from 'feed'
import { baseData, homePage, navbarData } from '~/data'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/xml')

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
    feed.addItem({
      title: `${baseData.me.name} | ${doc.title}`,
      id: baseData.site.url + doc.path,
      link: baseData.site.url + doc.path,
      description: doc.description,
      content: doc.description,
      date: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    })
  })

  return feed.rss2()
})
