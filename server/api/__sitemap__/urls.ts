import { seoData } from '~/data'

export default defineEventHandler(async (event) => {
  // eslint-disable-next-line ts/no-unsafe-argument
  // @ts-expect-error — Nitro auto-import types only declare the 1-arg overload; event is required at runtime
  const posts = await queryCollection(event, 'content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .select('path', 'lastUpdated', 'createdAt', 'tags', 'image', 'ogImage', 'title', 'description')
    .all()

  const urls: {
    loc: string
    lastmod?: string
    images?: { loc: string, title?: string, caption?: string }[]
  }[] = []

  const tagSet = new Set<string>()

  for (const post of posts) {
    const imgPath = post.ogImage || post.image
    const images = imgPath
      ? [{ loc: imgPath.startsWith('http') ? imgPath : `${seoData.mySite}${imgPath}`, title: post.title ?? undefined, caption: post.description ?? undefined }]
      : undefined

    urls.push({
      loc: post.path,
      lastmod: post.lastUpdated || post.createdAt || undefined,
      ...(images && { images }),
    })

    for (const tag of (post.tags ?? [])) tagSet.add(tag)
  }

  for (const tag of tagSet) {
    urls.push({ loc: `/categories/${tag}` })
  }

  return urls
})
