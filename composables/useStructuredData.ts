import { baseData, footerData, seoData, socialNetworks } from '~/data'

const SITE = seoData.mySite

const ID = {
  website: `${SITE}/#website`,
  person: `${SITE}/#person`,
  organization: `${SITE}/#organization`,
  logo: `${SITE}/#logo`,
}

function absUrl(path?: string): string {
  if (!path)
    return SITE
  if (/^https?:\/\//.test(path))
    return path
  return `${SITE}${path.startsWith('/') ? path : `/${path}`}`
}

function toIsoDate(value?: string): string | undefined {
  if (!value)
    return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function lang(): string {
  return (seoData.locale || 'en_US').replace('_', '-')
}

function personNode() {
  return {
    '@type': 'Person',
    '@id': ID.person,
    'name': baseData.me.name,
    'alternateName': baseData.me.nick,
    'url': `${SITE}/about`,
    'mainEntityOfPage': { '@id': `${SITE}/about#webpage` },
    'image': {
      '@type': 'ImageObject',
      'url': absUrl('/og-image.webp'),
    },
    'email': `mailto:${baseData.me.email}`,
    'jobTitle': 'Software Engineer',
    'description': footerData.aboutAuthor,
    'knowsAbout': [
      'Software Engineering',
      'Frontend Development',
      'Vue.js',
      'Nuxt',
      'TypeScript',
      'Node.js',
      'Game Development',
    ],
    'sameAs': socialNetworks
      .filter(s => /^https?:\/\//.test(s.href))
      .map(s => s.href),
    'worksFor': { '@id': ID.organization },
  }
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ID.organization,
    'name': 'XPLOIT FZE',
    'url': SITE,
    'logo': {
      '@type': 'ImageObject',
      '@id': ID.logo,
      'url': absUrl('/og-image.webp'),
    },
    'founder': { '@id': ID.person },
  }
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    'url': SITE,
    'name': seoData.ogTitle,
    'description': seoData.description,
    'inLanguage': lang(),
    'publisher': { '@id': ID.organization },
    'author': { '@id': ID.person },
    'copyrightHolder': { '@id': ID.organization },
  }
}

function breadcrumbNode(items: Array<{ name: string, url: string }>) {
  const last = items.at(-1)!
  return {
    '@type': 'BreadcrumbList',
    '@id': `${last.url}#breadcrumb`,
    'itemListElement': items.map((it, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': it.name,
      'item': it.url,
    })),
  }
}

interface WebPageOpts {
  url: string
  name: string
  description: string
  type?: 'WebPage' | 'AboutPage' | 'ProfilePage' | 'CollectionPage'
  breadcrumbId?: string
  image?: string
  datePublished?: string
  dateModified?: string
  primaryEntityId?: string
}

function webPageNode(opts: WebPageOpts) {
  const node: Record<string, unknown> = {
    '@type': opts.type || 'WebPage',
    '@id': `${opts.url}#webpage`,
    'url': opts.url,
    'name': opts.name,
    'description': opts.description,
    'isPartOf': { '@id': ID.website },
    'about': { '@id': ID.person },
    'inLanguage': lang(),
  }
  if (opts.image) {
    node.primaryImageOfPage = {
      '@type': 'ImageObject',
      'url': absUrl(opts.image),
    }
  }
  if (opts.breadcrumbId)
    node.breadcrumb = { '@id': opts.breadcrumbId }
  const pub = toIsoDate(opts.datePublished)
  const mod = toIsoDate(opts.dateModified)
  if (pub)
    node.datePublished = pub
  if (mod)
    node.dateModified = mod
  if (opts.primaryEntityId)
    node.mainEntity = { '@id': opts.primaryEntityId }
  return node
}

export interface BlogPostingInput {
  url: string
  title: string
  description: string
  image?: string
  ogImage?: string
  alt?: string
  createdAt: string
  lastUpdated?: string
  tags?: string[]
  locale?: string
  wordCount?: number
  readingTime?: number
}

function blogPostingNode(post: BlogPostingInput) {
  const imgUrl = absUrl(post.ogImage || post.image)
  const pub = toIsoDate(post.createdAt) || new Date().toISOString()
  const mod = toIsoDate(post.lastUpdated) || pub
  const node: Record<string, unknown> = {
    '@type': 'BlogPosting',
    '@id': `${post.url}#article`,
    'isPartOf': { '@id': `${post.url}#webpage` },
    'mainEntityOfPage': { '@id': `${post.url}#webpage` },
    'url': post.url,
    'headline': post.title,
    'description': post.description,
    'image': {
      '@type': 'ImageObject',
      'url': imgUrl,
      'caption': post.alt || post.description,
      'width': seoData.ogImageWidth,
      'height': seoData.ogImageHeight,
    },
    'datePublished': pub,
    'dateModified': mod,
    'author': { '@id': ID.person },
    'publisher': { '@id': ID.organization },
    'inLanguage': (post.locale || seoData.locale).replace('_', '-'),
  }
  if (post.tags?.length) {
    node.keywords = post.tags.join(', ')
    node.articleSection = post.tags
  }
  if (post.wordCount && post.wordCount > 0)
    node.wordCount = post.wordCount
  if (post.readingTime && post.readingTime > 0)
    node.timeRequired = `PT${post.readingTime}M`
  return node
}

interface ItemListOpts {
  id: string
  name?: string
  items: Array<{ url: string, name: string, image?: string }>
}

interface ToolFaqItem {
  question: string
  answer: string
}

interface ToolPageSchemaOpts {
  path: string
  title: string
  description: string
  ogImage?: string
  robots?: string
  appCategory?: string
  appName?: string
  appDescription?: string
  appIsFree?: boolean
  faq?: ToolFaqItem[]
}

function itemListNode(opts: ItemListOpts) {
  return {
    '@type': 'ItemList',
    '@id': opts.id,
    ...(opts.name ? { name: opts.name } : {}),
    'numberOfItems': opts.items.length,
    'itemListElement': opts.items.map((it, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'url': it.url,
      'name': it.name,
      ...(it.image ? { image: absUrl(it.image) } : {}),
    })),
  }
}

function injectGraph(graph: unknown[]) {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  }).replace(/</g, '\\u003c')

  useHead({
    script: [
      {
        key: 'schema-graph',
        type: 'application/ld+json',
        innerHTML: json,
        tagDuplicateStrategy: 'replace',
      },
    ],
  })
}

// ─── Page hooks ──────────────────────────────────────────────────────────────

export function useHomeSchema(opts: { name: string, description: string }) {
  const url = `${SITE}/`
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url,
      name: opts.name,
      description: opts.description,
      type: 'WebPage',
      primaryEntityId: ID.person,
    }),
  ])
}

export function useAboutSchema(opts: { description: string }) {
  const url = `${SITE}/about`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'About', url },
  ])
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url,
      name: `About ${baseData.me.name}`,
      description: opts.description,
      type: 'AboutPage',
      breadcrumbId: crumb['@id'],
      primaryEntityId: ID.person,
    }),
    crumb,
  ])
}

export function useBlogIndexSchema(opts: { description: string }) {
  const url = `${SITE}/blogs`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Blogs', url },
  ])
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    {
      '@type': 'Blog',
      '@id': `${url}#blog`,
      'url': url,
      'name': 'Blogs',
      'description': opts.description,
      'inLanguage': lang(),
      'isPartOf': { '@id': ID.website },
      'author': { '@id': ID.person },
      'publisher': { '@id': ID.organization },
    },
    webPageNode({
      url,
      name: 'Blogs',
      description: opts.description,
      type: 'CollectionPage',
      breadcrumbId: crumb['@id'],
    }),
    crumb,
  ])
}

export function useBlogPostSchema(post: BlogPostingInput) {
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Blogs', url: `${SITE}/blogs` },
    { name: post.title, url: post.url },
  ])
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url: post.url,
      name: post.title,
      description: post.description,
      type: 'WebPage',
      breadcrumbId: crumb['@id'],
      image: post.ogImage || post.image,
      datePublished: post.createdAt,
      dateModified: post.lastUpdated || post.createdAt,
      primaryEntityId: `${post.url}#article`,
    }),
    blogPostingNode(post),
    crumb,
  ])
}

export function useCategoriesIndexSchema(opts: {
  description: string
  items?: Array<{ url: string, name: string }>
}) {
  const url = `${SITE}/categories`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Categories', url },
  ])
  const graph: unknown[] = [
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url,
      name: 'Categories',
      description: opts.description,
      type: 'CollectionPage',
      breadcrumbId: crumb['@id'],
    }),
    crumb,
  ]
  if (opts.items?.length) {
    graph.push(itemListNode({
      id: `${url}#list`,
      name: 'Categories',
      items: opts.items,
    }))
  }
  injectGraph(graph)
}

export function useCategoryPageSchema(opts: {
  url: string
  category: string
  description: string
  posts: Array<{ path: string, title: string, image?: string, ogImage?: string }>
}) {
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Categories', url: `${SITE}/categories` },
    { name: opts.category, url: opts.url },
  ])
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url: opts.url,
      name: opts.category,
      description: opts.description,
      type: 'CollectionPage',
      breadcrumbId: crumb['@id'],
    }),
    itemListNode({
      id: `${opts.url}#list`,
      name: opts.category,
      items: opts.posts.map(p => ({
        url: absUrl(p.path),
        name: p.title,
        image: p.ogImage || p.image,
      })),
    }),
    crumb,
  ])
}

export function useGenericPageSchema(opts: {
  url: string
  name: string
  description: string
  parents?: Array<{ name: string, url: string }>
  type?: 'WebPage' | 'CollectionPage' | 'AboutPage'
  image?: string
  datePublished?: string
  dateModified?: string
}) {
  const items = [
    { name: 'Home', url: `${SITE}/` },
    ...(opts.parents || []),
    { name: opts.name, url: opts.url },
  ]
  const crumb = breadcrumbNode(items)
  injectGraph([
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url: opts.url,
      name: opts.name,
      description: opts.description,
      type: opts.type || 'WebPage',
      breadcrumbId: crumb['@id'],
      image: opts.image,
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
    }),
    crumb,
  ])
}

// Rule for new tool pages:
// use this helper instead of custom useHead blocks to keep metadata/schema
// formatting consistent with existing pages in this codebase.
export function useToolPageSchema(opts: ToolPageSchemaOpts) {
  const url = absUrl(opts.path)
  const image = opts.ogImage ? absUrl(opts.ogImage) : absUrl('/og-image.webp')

  useHead({
    title: opts.title,
    link: [
      { rel: 'canonical', href: url },
    ],
    meta: [
      { name: 'description', content: opts.description },
      { name: 'robots', content: opts.robots || 'index, follow' },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: opts.title },
      { name: 'twitter:description', content: opts.description },
      { name: 'twitter:image', content: image },
    ],
  })

  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Tools', url: `${SITE}/tools` },
    { name: opts.title, url },
  ])

  const graph: unknown[] = [
    websiteNode(),
    organizationNode(),
    personNode(),
    webPageNode({
      url,
      name: opts.title,
      description: opts.description,
      type: 'WebPage',
      breadcrumbId: crumb['@id'],
      image: opts.ogImage || '/og-image.webp',
      primaryEntityId: `${url}#app`,
    }),
    {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      'name': opts.appName || opts.title,
      'applicationCategory': opts.appCategory || 'UtilitiesApplication',
      'operatingSystem': 'Web',
      'url': url,
      'description': opts.appDescription || opts.description,
      ...(opts.appIsFree
        ? {
            offers: {
              '@type': 'Offer',
              'price': '0',
              'priceCurrency': 'USD',
            },
          }
        : {}),
    },
    crumb,
  ]

  if (opts.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      'mainEntity': opts.faq.map(item => ({
        '@type': 'Question',
        'name': item.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.answer,
        },
      })),
    })
  }

  injectGraph(graph)
}
