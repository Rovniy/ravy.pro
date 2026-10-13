import { Feed } from 'feed'
import { baseData } from '~/data'
import { tilPage, tilTopic } from '~/data/til'
import { renderMarkdown } from '../../utils/blog-render'
import { mdcToHtml } from '../../utils/mdc-html'
import { getNotes, listNotes } from '../../utils/til-store'

/** Full-text feed of the 50 newest notes. Separate from /rss.xml so blog readers aren't flooded. */
// Cached in-process as well as at the CDN: each of the two instances would
// otherwise re-read and re-render every note on its own CDN misses.
export default defineCachedEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'cache-control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')

  const index = (await listNotes({ publishedOnly: true })).slice(0, 50)
  const notes = await getNotes(index.map(n => n.slug))

  const feed = new Feed({
    title: `${baseData.me.name}: ${tilPage.title}`,
    description: tilPage.description,
    id: `${baseData.site.url}/til`,
    link: `${baseData.site.url}/til`,
    language: 'en',
    favicon: `${baseData.site.url}/favicon.ico`,
    copyright: baseData.site.licence,
    feedLinks: { rss: `${baseData.site.url}/til/rss.xml` },
    author: { name: baseData.me.name, email: baseData.me.email, link: baseData.site.url },
  })

  for (const note of notes.filter(n => n.published)) {
    const html = mdcToHtml(await renderMarkdown(note.markdown), baseData.site.url)
    feed.addItem({
      title: note.title,
      id: baseData.site.url + note.path,
      link: baseData.site.url + note.path,
      description: note.excerpt,
      content: html || note.excerpt,
      date: note.createdAt ? new Date(note.createdAt) : new Date(),
      category: note.topics.map(t => ({ name: tilTopic(t)?.name ?? t })),
    })
  }

  return feed.rss2()
}, { name: 'rss-til', maxAge: 3600, swr: true })
