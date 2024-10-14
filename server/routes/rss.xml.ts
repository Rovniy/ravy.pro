import { Feed } from 'feed'
import { serverQueryContent } from '#content/server'

const basePath = 'https://ravy.pro'

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'text/xml')
  const docs = await serverQueryContent(event).sort({ date: -1 }).find()
  const feed = new Feed({
    title: 'Ravy\'s personal blog site',
    description: 'Ravy\'s personal blog site',
    id: basePath,
    link: basePath,
    language: 'en',
    favicon: `${basePath}/favicon.ico`,
    copyright: 'MIT',
    author: {
      name: 'Andrei (Ravy) Rovnyi',
      email: 'contact@ravy.pro',
      link: basePath,
    },
  })

  // Add the feed items
  docs.forEach((doc) => {
    feed.addItem({
      title: doc.title || '',
      id: basePath + doc._path,
      link: basePath + doc._path,
      description: doc.description,
      content: doc.description,
      date: new Date(doc.date),
    })
  })

  return feed.rss2()
})
