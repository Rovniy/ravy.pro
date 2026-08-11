import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { useToolRatings } from '~/composables/useToolRating'
import { baseData, footerData, seoData, socialNetworks } from '~/data'
import { EVENTS, toolIdFromPath } from '~/data/analytics'

const SITE = seoData.mySite

const ID = {
  website: `${SITE}/#website`,
  person: `${SITE}/#person`,
  /** The studio he founded. */
  organization: `${SITE}/#organization`,
  /** The company he works for — a different entity from the one he founded. */
  employer: `${SITE}/#employer`,
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

/**
 * Profiles that belong in `Person.sameAs` but aren't in `socialNetworks`.
 *
 * `sameAs` is how a search engine or an LLM decides that this Andrei Rovnyi is
 * the same entity as the one on GitHub, YouTube and npm. It was derived from
 * `socialNetworks` alone — five URLs — while the site itself linked six more
 * from /contacts and /about that never made it into the graph.
 */
const EXTRA_SAME_AS = [
  'https://www.youtube.com/@xploit-games',
  'https://steamcommunity.com/id/xploit-gaming/',
  'https://www.npmjs.com/~ravy',
  'https://xploit.games',
  'https://habr.com/ru/users/xploitravy/',
]

function personNode() {
  return {
    '@type': 'Person',
    '@id': ID.person,
    'name': baseData.me.name,
    'alternateName': baseData.me.nick,
    'url': `${SITE}/about`,
    'mainEntityOfPage': { '@id': `${SITE}/about#webpage` },
    // The portrait, not the generic site OG card. `Person.image` is what a
    // knowledge panel would show, and it was pointing at the share graphic.
    'image': {
      '@type': 'ImageObject',
      'url': absUrl('/photos/a_rovnyi_deep.webp'),
    },
    'email': `mailto:${baseData.me.email}`,
    // Matches every other surface on the site. `Software Engineer` alone
    // contradicted data/index.ts, the about-page title, and the hero roles — and
    // it was the one machine-readable version.
    'jobTitle': 'Engineering Manager',
    'hasOccupation': [
      {
        '@type': 'Occupation',
        'name': 'Engineering Manager',
      },
      {
        '@type': 'Occupation',
        'name': 'Software Developer',
      },
      {
        '@type': 'Occupation',
        'name': 'Founder',
      },
    ],
    'description': footerData.aboutAuthor,
    'knowsAbout': [
      'Software Engineering',
      'Frontend Development',
      'Vue.js',
      'Nuxt',
      'TypeScript',
      'Node.js',
      'Game Development',
      'Unity',
      'Mobile Games',
      'Real-Time Systems',
      'WebRTC',
      'AI-Assisted Development',
      'Automation Workflows',
      'Technical Mentorship',
      'Technical Hiring and Interviewing',
    ],
    'sameAs': [
      ...socialNetworks
        .filter(s => /^https?:\/\//.test(s.href))
        .map(s => s.href),
      ...EXTRA_SAME_AS,
    ],
    // `worksFor` is the employer; the studio is a separate claim via
    // `Organization.founder`. Pointing `worksFor` at his own company made the
    // graph silent about the current job, which only existed in prose.
    'worksFor': { '@id': ID.employer },
    'founder': { '@id': ID.organization },
  }
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': ID.organization,
    'name': 'XPLOIT FZE',
    'legalName': 'XPLOIT FZE',
    'url': SITE,
    'logo': {
      '@type': 'ImageObject',
      '@id': ID.logo,
      'url': absUrl('/og-image.webp'),
    },
    'sameAs': [
      'https://xploit.games',
      'https://tinyboohomecoming.com',
    ],
    'founder': { '@id': ID.person },
  }
}

/**
 * The current employer, as its own entity rather than a string inside
 * `Person.description`. The description hardcodes "currently at Gaijin.net",
 * which is a fact that rots silently; this at least makes the claim structured
 * and in one place.
 */
function employerNode() {
  return {
    '@type': 'Organization',
    '@id': ID.employer,
    'name': 'Gaijin Entertainment',
    'url': 'https://gaijin.net/',
  }
}

/**
 * The four nodes that describe "who runs this site", present in every page's
 * graph and referenced by `@id` from the page-specific nodes.
 *
 * Grouped into one helper because they are a set: `Person.worksFor` points at
 * the employer node, so emitting the person without the employer would leave a
 * dangling `@id` in every graph on the site.
 */
function identityNodes() {
  return [websiteNode(), organizationNode(), employerNode(), personNode()]
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

// Shared SEO head for standalone landing pages (tools, services). Extracted so
// the tool and service composables can't drift on canonical/OG/Twitter tags.
function pageHead(opts: {
  url: string
  title: string
  description: string
  image: string
  robots?: string
}) {
  useHead({
    title: opts.title,
    link: [
      { rel: 'canonical', href: opts.url },
    ],
    meta: [
      { name: 'description', content: opts.description },
      { name: 'robots', content: opts.robots || 'index, follow' },
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: opts.url },
      { property: 'og:image', content: opts.image },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: opts.title },
      { name: 'twitter:description', content: opts.description },
      { name: 'twitter:image', content: opts.image },
    ],
  })
}

/**
 * Per-page Open Graph / Twitter title+description.
 *
 * Emitted from the schema composables rather than added to each page, because
 * every affected page already calls exactly one of them and already passes the
 * name + description this needs. The previous arrangement — a hardcoded
 * `og:title`/`og:description` in `siteMetaData` — meant a page that set only
 * `name: description` silently inherited the home page's identity, and seven
 * pages did exactly that. Deriving it here makes that failure impossible: you
 * cannot register the schema without also registering the social tags.
 *
 * `og:url`/`twitter:url` are NOT set here — they come from the canonical in
 * layouts/default.vue, which is the single source for "what page is this".
 * `og:image` is only emitted when a page has a specific one; otherwise
 * `defineOgImage()` or the site fallback in `siteMetaData` applies.
 */
function socialMeta(opts: { title: string, description: string, image?: string }) {
  useHead({
    meta: [
      { property: 'og:title', content: opts.title },
      { property: 'og:description', content: opts.description },
      { name: 'twitter:title', content: opts.title },
      { name: 'twitter:description', content: opts.description },
      ...(opts.image
        ? [
            { property: 'og:image', content: opts.image },
            { name: 'twitter:image', content: opts.image },
          ]
        : []),
    ],
  })
}

function faqPageNode(url: string, items: Array<{ question: string, answer: string }>) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  }
}

function howToNode(url: string, opts: {
  name: string
  description?: string
  steps: Array<{ name: string, text: string }>
}) {
  return {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    'name': opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    'step': opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      'position': i + 1,
      'name': s.name,
      'text': s.text,
    })),
  }
}

// A paid, human-delivered offering.
//
// `Service`, not `ProfessionalService`: the latter is a LocalBusiness subtype and
// invites address/opening-hours/geo expectations that don't apply to remote
// one-on-one work, so emitting it without an address is a weaker claim.
//
// The Offer deliberately carries a `description` and NO `price`/`priceCurrency`.
// `price: '0'` is true of the upfront cost but Google would render "Free", which
// misrepresents an income-share arrangement. This forgoes price rich results on
// purpose rather than shipping a misleading number.
//
// Do NOT add `aggregateRating` or `Review` here. There is no rating source for
// services (the tool ratings come from real Firestore counters), the case studies
// are anonymised and unverifiable, and self-serving review markup on a commercial
// page is a manual-action risk for the whole domain.
function serviceNode(opts: {
  url: string
  name: string
  serviceType: string
  description: string
  areaServed?: string[]
  availableLanguage?: string[]
  audience?: string
  offerDescription?: string
}) {
  return {
    '@type': 'Service',
    '@id': `${opts.url}#service`,
    'name': opts.name,
    'serviceType': opts.serviceType,
    'description': opts.description,
    'url': opts.url,
    'provider': { '@id': ID.person },
    'brand': { '@id': ID.organization },
    ...(opts.areaServed?.length
      ? { areaServed: opts.areaServed.map(name => ({ '@type': 'Country', name })) }
      : {}),
    ...(opts.availableLanguage?.length
      ? { availableLanguage: opts.availableLanguage.map(name => ({ '@type': 'Language', name })) }
      : {}),
    ...(opts.audience
      ? { audience: { '@type': 'Audience', 'audienceType': opts.audience } }
      : {}),
    ...(opts.offerDescription
      ? {
          offers: {
            '@type': 'Offer',
            'description': opts.offerDescription,
            'availability': 'https://schema.org/InStock',
            'url': opts.url,
          },
        }
      : {}),
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
  /**
   * OG-style locale (`ru_RU`) for a page that isn't in the site's default
   * language. Without it the WebPage node claimed `en-US` while the BlogPosting
   * inside it claimed `ru-RU` — two nodes describing the same page disagreeing
   * about its language.
   */
  locale?: string
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
    'inLanguage': opts.locale ? opts.locale.replace('_', '-') : lang(),
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
    // No width/height: post OG images vary in size and wrong declared
    // dimensions are worse for rich results than none at all.
    'image': {
      '@type': 'ImageObject',
      'url': imgUrl,
      'caption': post.alt || post.description,
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
  /** Defaults to 'Web'. Set it for tools that are a download rather than a page. */
  appOperatingSystem?: string
  /** Where the binary comes from — only meaningful for downloadable apps. */
  appDownloadUrl?: string
  /**
   * Ref/getter tolerated: the app node is rebuilt reactively, so a version
   * resolved by a client-side fetch still lands in the graph.
   */
  appSoftwareVersion?: MaybeRefOrGetter<string | undefined>
  offer?: { price: string, currency?: string }
  datePublished?: string
  dateModified?: string
  howTo?: { name: string, description?: string, steps: Array<{ name: string, text: string }> }
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

// Accepts a plain array (static graph) or a getter — the getter form makes
// useHead reactive, so the JSON-LD updates when async data (e.g. tool
// ratings) arrives on the client.
function injectGraph(graph: unknown[] | (() => unknown[])) {
  const build = () => JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': typeof graph === 'function' ? graph() : graph,
  }).replace(/</g, '\\u003c')

  useHead({
    script: [
      {
        key: 'schema-graph',
        type: 'application/ld+json',
        innerHTML: typeof graph === 'function' ? build : build(),
        tagDuplicateStrategy: 'replace',
      },
    ],
  })
}

// ─── Page hooks ──────────────────────────────────────────────────────────────

export function useHomeSchema(opts: { name: string, description: string }) {
  const url = `${SITE}/`
  injectGraph([
    ...identityNodes(),
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
  socialMeta({ title: `About ${baseData.me.name}`, description: opts.description })
  injectGraph([
    ...identityNodes(),
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

export function useBlogIndexSchema(opts: { description: string, title?: string }) {
  const url = `${SITE}/blogs`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Blogs', url },
  ])
  socialMeta({ title: opts.title || 'Blog', description: opts.description })
  injectGraph([
    ...identityNodes(),
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
    ...identityNodes(),
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
      locale: post.locale,
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
  socialMeta({ title: 'Categories', description: opts.description })
  const graph: unknown[] = [
    ...identityNodes(),
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
  socialMeta({ title: opts.category, description: opts.description })
  injectGraph([
    ...identityNodes(),
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
  socialMeta({ title: opts.name, description: opts.description, image: opts.image })
  injectGraph([
    ...identityNodes(),
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

// The /services index. Sets no head — the page uses a plain useHead, same as
// /contacts. `ItemList` rather than `OfferCatalog`: the latter expects priced
// Offers, and two of the three offerings have no published price.
export function useServicesIndexSchema(opts: {
  description: string
  items: Array<{ path: string, name: string }>
}) {
  const url = `${SITE}/services`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Services', url },
  ])
  injectGraph([
    ...identityNodes(),
    webPageNode({
      url,
      name: 'Services',
      description: opts.description,
      type: 'CollectionPage',
      breadcrumbId: crumb['@id'],
    }),
    itemListNode({
      id: `${url}#list`,
      name: 'Services',
      items: opts.items.map(i => ({ url: absUrl(i.path), name: i.name })),
    }),
    crumb,
  ])
}

/**
 * The /tools hub. Modelled on `useServicesIndexSchema` — `ItemList` of the tool
 * pages, not a list of `SoftwareApplication` nodes: each tool page already
 * declares its own app node with its own `@id`, and restating them here would
 * put two descriptions of the same entity in two graphs.
 *
 * This page has to exist for another reason too: every tool page's breadcrumb
 * has always named `/tools` as its parent, and that URL used to 404.
 */
export function useToolsIndexSchema(opts: {
  title: string
  description: string
  items: Array<{ path: string, name: string, description?: string }>
}) {
  const url = `${SITE}/tools`
  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Tools', url },
  ])
  socialMeta({ title: opts.title, description: opts.description })
  injectGraph([
    ...identityNodes(),
    webPageNode({
      url,
      name: 'Tools',
      description: opts.description,
      type: 'CollectionPage',
      breadcrumbId: crumb['@id'],
    }),
    itemListNode({
      id: `${url}#list`,
      name: 'Tools',
      items: opts.items.map(i => ({ url: absUrl(i.path), name: i.name })),
    }),
    crumb,
  ])
}

export interface ServicePageSchemaOpts {
  path: string
  title: string
  description: string
  ogImage?: string
  robots?: string
  /** Service node. */
  serviceName: string
  serviceType: string
  serviceDescription?: string
  areaServed?: string[]
  availableLanguage?: string[]
  audience?: string
  offerDescription?: string
  /** The program steps, emitted as HowTo. */
  program?: { name: string, description?: string, steps: Array<{ name: string, text: string }> }
  faq?: Array<{ question: string, answer: string }>
  datePublished?: string
  dateModified?: string
  /** An OfferingId — fires `service_view` on mount, mirroring tool_view. */
  serviceId?: string
}

// Rule for new service pages: use this instead of a custom useHead block, and
// don't route them through useToolPageSchema — a service is not a
// SoftwareApplication and has no rating source.
export function useServicePageSchema(opts: ServicePageSchemaOpts) {
  const url = absUrl(opts.path)

  pageHead({
    url,
    title: opts.title,
    description: opts.description,
    image: opts.ogImage ? absUrl(opts.ogImage) : absUrl('/og-image.webp'),
    robots: opts.robots,
  })

  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Services', url: `${SITE}/services` },
    { name: opts.title, url },
  ])

  const tail: unknown[] = []

  if (opts.faq?.length)
    tail.push(faqPageNode(url, opts.faq))

  // HowTo for the program steps, not a second ItemList — emitting both for the
  // same six steps is duplicate modelling.
  if (opts.program?.steps.length)
    tail.push(howToNode(url, opts.program))

  // Plain array, not a getter: nothing here resolves asynchronously.
  injectGraph([
    ...identityNodes(),
    webPageNode({
      url,
      name: opts.title,
      description: opts.description,
      type: 'WebPage',
      breadcrumbId: crumb['@id'],
      image: opts.ogImage || '/og-image.webp',
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
      primaryEntityId: `${url}#service`,
    }),
    serviceNode({
      url,
      name: opts.serviceName,
      serviceType: opts.serviceType,
      description: opts.serviceDescription || opts.description,
      areaServed: opts.areaServed,
      availableLanguage: opts.availableLanguage,
      audience: opts.audience,
      offerDescription: opts.offerDescription,
    }),
    crumb,
    ...tail,
  ])

  // Funnel entry, mirroring the tool_view hook below. Client-only via onMounted.
  if (opts.serviceId) {
    const serviceId = opts.serviceId
    onMounted(() => {
      useAnalytics().track(EVENTS.SERVICE_VIEW, { service: serviceId })
    })
  }
}

// Rule for new tool pages:
// use this helper instead of custom useHead blocks to keep metadata/schema
// formatting consistent with existing pages in this codebase.
export function useToolPageSchema(opts: ToolPageSchemaOpts) {
  const url = absUrl(opts.path)

  pageHead({
    url,
    title: opts.title,
    description: opts.description,
    image: opts.ogImage ? absUrl(opts.ogImage) : absUrl('/og-image.webp'),
    robots: opts.robots,
  })

  const crumb = breadcrumbNode([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Tools', url: `${SITE}/tools` },
    { name: opts.title, url },
  ])

  const toolId = toolIdFromPath(opts.path)
  // Shared rating state. It is populated *before the server renders* by
  // plugins/tool-ratings.server.ts — that is what puts `aggregateRating` into the
  // prerendered HTML, which is the only version crawlers and AI fetchers read.
  // Loading it client-side (the previous arrangement) meant the node existed only
  // after hydration and effectively never shipped.
  const { ratings } = useToolRatings()

  // Still built lazily: the rating can also arrive or change client-side after a
  // vote, and the graph getter below re-runs on that state change.
  const appNode = () => {
    const summary = toolId ? ratings.value?.[toolId] : null
    const version = toValue(opts.appSoftwareVersion)
    return {
      '@type': 'SoftwareApplication',
      '@id': `${url}#app`,
      'name': opts.appName || opts.title,
      'applicationCategory': opts.appCategory || 'UtilitiesApplication',
      'operatingSystem': opts.appOperatingSystem || 'Web',
      'url': url,
      'description': opts.appDescription || opts.description,
      ...(version ? { softwareVersion: version } : {}),
      ...(opts.appDownloadUrl ? { downloadUrl: opts.appDownloadUrl } : {}),
      ...(opts.offer
        ? {
            offers: {
              '@type': 'Offer',
              'price': opts.offer.price,
              'priceCurrency': (opts.offer.currency || 'USD').toUpperCase(),
              'availability': 'https://schema.org/OnlineOnly',
              'url': url,
            },
          }
        : opts.appIsFree
          ? {
              offers: {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'USD',
              },
            }
          : {}),
      ...(summary && summary.count > 0
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              'ratingValue': summary.average,
              'ratingCount': summary.count,
              'bestRating': 5,
              'worstRating': 1,
            },
          }
        : {}),
    }
  }

  const tail: unknown[] = []

  if (opts.faq?.length)
    tail.push(faqPageNode(url, opts.faq))

  if (opts.howTo?.steps.length)
    tail.push(howToNode(url, opts.howTo))

  injectGraph(() => [
    ...identityNodes(),
    webPageNode({
      url,
      name: opts.title,
      description: opts.description,
      type: 'WebPage',
      breadcrumbId: crumb['@id'],
      image: opts.ogImage || '/og-image.webp',
      datePublished: opts.datePublished,
      dateModified: opts.dateModified,
      primaryEntityId: `${url}#app`,
    }),
    appNode(),
    crumb,
    ...tail,
  ])

  // Funnel entry: every tool page calls this helper, so all tools emit a
  // `tool_view` automatically. Client-only via onMounted.
  if (toolId) {
    onMounted(() => {
      useAnalytics().track(EVENTS.TOOL_VIEW, { tool_id: toolId })
    })
  }
}
