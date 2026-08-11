<script setup lang="ts">
import type { BlogPost } from '@/types/blog'
import type { BlogPostMeta } from '~/utils/blog-post'
import { blogsPage, navbarData, seoData } from '~/data'
import { EVENTS } from '~/data/analytics'
import { slugFromPath } from '~/utils/blog-post'
import { countWords, readingTimeMinutes } from '~/utils/count-words'

interface BlogPostResponse extends BlogPostMeta {
  body: Record<string, unknown>
}

const { path } = useRoute()
const slug = slugFromPath(path)

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () =>
  $fetch<BlogPostResponse>(`/api/blog/post/${slug}`))

// A backend failure must not be reported as a 404: these URLs are indexed, and
// telling Google 32 real posts are gone because Firestore blinked is far worse
// than a 503 it will retry.
if (error.value || !articles?.value) {
  const status = (error.value as { statusCode?: number } | null)?.statusCode
  throw status === 404 || !error.value
    ? createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
    : createError({ statusCode: 503, statusMessage: 'Post temporarily unavailable', fatal: true })
}

// One list fetch serves both the prev/next nav and the related posts. The key
// is shared with the other pages that read it, so Nuxt dedupes it in the payload.
const { data: allPosts } = await useAsyncData('blog-post-list', () =>
  $fetch<BlogPostMeta[]>('/api/blog/posts'))

const surround = computed(() => {
  // The list arrives newest-first; prev/next read chronologically.
  const chronological = [...(allPosts.value ?? [])].reverse()
  const idx = chronological.findIndex(p => p.path === path)
  if (idx < 0)
    return { prev: null, next: null }
  return {
    prev: idx > 0 ? chronological[idx - 1] : null,
    next: idx < chronological.length - 1 ? chronological[idx + 1] : null,
  }
})

// Topically related posts (shared tag), newest first — chronological
// prev/next alone doesn't surface the rest of a series.
const related = computed(() => {
  const tags = articles.value?.tags ?? []
  if (!tags.length)
    return []
  return (allPosts.value ?? [])
    .filter(post => post.path !== path && post.tags.some(tag => tags.includes(tag)))
    .slice(0, 3)
})

const wordCount = computed(() => countWords(articles.value?.body ?? {}))
const readingTime = computed(() => readingTimeMinutes(wordCount.value))

onMounted(() => {
  useAnalytics().track(EVENTS.BLOG_VIEW, {
    slug: path,
    title: articles.value?.title || '',
    reading_time: readingTime.value,
    tags: articles.value?.tags || [],
  })
})

const data = computed<BlogPost>(() => {
  return {
    title: articles.value?.title || 'no-title available',
    description: articles.value?.description || 'no-description available',
    image: articles.value?.image || '/not-found.png',
    alt: articles.value?.alt || articles.value?.description || 'no alter data available',
    ogImage: articles.value?.ogImage || articles.value?.image || '/not-found.png',
    tags: articles.value?.tags || [],
    published: articles.value?.published || false,
    // No `|| seoData.theme` fallback: a site-wide default here is what made every
    // post advertise itself as 'Gamedev'. Absent means "use the tags".
    theme: articles.value?.theme || '',
    // Raw ISO, not pre-formatted: BlogHeader needs the machine-readable value
    // for `<time datetime>` and does its own display formatting.
    createdAt: articles.value?.createdAt || '',
    // Falls back to createdAt, not to `now`: these pages are prerendered, so a
    // `new Date()` here would freeze the build timestamp into
    // `article:modified_time` and claim every post was edited at deploy time.
    lastUpdated: articles.value?.lastUpdated || articles.value?.createdAt || '',
    locale: articles.value?.locale || seoData.locale,
  }
})

// `og:locale` is `ru_RU`-shaped; `<html lang>` wants the bare language subtag.
const htmlLang = computed(() => data.value.locale.split(/[_-]/)[0].toLowerCase() || 'en')

/**
 * `article:tag` comes from the post's own tags, one tag per meta entry.
 *
 * It used to be a single value defaulting to `seoData.theme` ('Gamedev'), and
 * since no post has ever set a `theme`, every article on the site claimed to be
 * about game development — including a pure-JavaScript one. The tags are the
 * real subject and they already drive the category hubs; `theme` stays supported
 * as an explicit override for a post whose subject isn't its tags.
 */
const articleTags = computed(() => {
  const explicit = articles.value?.theme
  if (explicit)
    return [explicit]
  return data.value.tags?.length ? data.value.tags : []
})

// A post can opt out of indexing while staying readable and linked (see the
// `noindex` field in content.config.ts). `follow` is deliberate — the links out
// of it, especially to the category hubs, should still carry.
const robots = computed(() =>
  articles.value?.noindex ? 'noindex, follow' : 'index, follow')

useHead({
  title: data.value.title || '',
  htmlAttrs: { lang: htmlLang },
  meta: [
    { name: 'description', content: data.value.description },
    { name: 'robots', content: robots },
    { property: 'article:author', content: seoData.author },
    { property: 'article:published_time', content: articles.value?.createdAt || '' },
    { property: 'article:modified_time', content: data.value.lastUpdated },
    { property: 'article:section', content: data.value.tags?.at(0) },
    ...articleTags.value.map(tag => ({ property: 'article:tag', content: tag })),
    { property: 'og:site_name', content: navbarData.homeTitle },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `${seoData.mySite}${path}` },
    { property: 'og:title', content: data.value.title },
    { property: 'og:description', content: data.value.description },
    // og:image / twitter:image (with correct 1200×630 dimensions) are
    // injected by nuxt-og-image from the defineOgImage('Blog', …) call below.
    { property: 'og:locale', content: data.value.locale },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: seoData.twitterHandle },
    { name: 'twitter:url', content: `${seoData.mySite}${path}` },
    { name: 'twitter:title', content: data.value.title },
    { name: 'twitter:description', content: data.value.description },
  ],
  link: [
    {
      rel: 'canonical',
      href: `${seoData.mySite}${path}`,
    },
    {
      rel: 'preload',
      as: 'image',
      href: data.value.image,
      type: 'image/webp',
    },
  ],
})

useBlogPostSchema({
  url: `${seoData.mySite}${path}`,
  title: data.value.title,
  description: data.value.description,
  image: data.value.image,
  ogImage: data.value.ogImage,
  alt: data.value.alt,
  createdAt: articles.value?.createdAt || '',
  lastUpdated: data.value.lastUpdated,
  tags: data.value.tags,
  locale: data.value.locale,
  wordCount: wordCount.value,
  readingTime: readingTime.value,
})

const hashTags = computed(() => {
  if (!data.value?.tags || !data.value.tags.length)
    return ''
  return data.value.tags.reduce((acc, i) => {
    acc += `${i}, `
    return acc
  }, '')
})

defineOgImage('Blog', {
  headline: blogsPage.og.title,
  title: data.value.title || '',
  description: data.value.description || '',
  link: data.value.ogImage || data.value.image,
  url: data.value.ogImage || data.value.image,
})
</script>

<template>
  <div>
    <BlogReadingProgress :slug="path" />

    <div class="px-6 container max-w-5xl mx-auto sm:grid grid-cols-12 gap-x-12">
      <!--
        `<article>` around the post, not a bare div: without it the only
        <article> elements on the page were the three related-post *cards*, so
        the markup asserted the sidebar cards were articles and the post itself
        was not. The JSON-LD said BlogPosting all along — this makes the HTML
        agree with it.
      -->
      <article class="col-span-12 lg:col-span-9">
        <BlogHeader
          :title="data.title"
          :image="data.image"
          :alt="data.alt"
          :created-at="data.createdAt"
          :last-updated="data.lastUpdated"
          :description="data.description"
          :tags="data.tags"
          :reading-time="readingTime"
        />
        <div
          class="prose prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
          prose-h1:no-underline mx-auto prose-slate dark:prose-invert prose-img:rounded-lg prose-img:mx-auto prose-img:block"
        >
          <!--
            No `:components` map here any more. It used to pass a local Image.vue
            hoping to control in-article images, but ContentRenderer maps by
            rendered tag name (`img`), so that component was never reached and
            the images stayed eager and full-size. Sizing now lives where MDC
            actually looks: components/content/ProseImg.vue.
          -->
          <ContentRenderer v-if="articles" :value="articles">
            <template #empty>
              <p>No content found.</p>
            </template>
          </ContentRenderer>
        </div>
      </article>

      <BlogToc :articles="articles" />

      <div class="col-span-12 flex flex-row flex-wrap md:flex-nowrap mt-10 gap-2">
        <LazySocialShare
          v-for="network in ['facebook', 'twitter', 'linkedin', 'telegram', 'email']"
          :key="network"
          :network="network"
          :url="`${seoData.mySite}${path}`"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          :hashtags="hashTags"
          aria-label="Share with {network}"
        />
      </div>

      <section v-if="related?.length" class="col-span-12 mt-10 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
          Related posts
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BlogCard
            v-for="post in related"
            :key="post.path"
            :path="post.path"
            :title="post.title"
            :description="post.description"
            :image="post.image"
            :alt="post.alt || post.title"
            :tags="post.tags"
            :created-at="post.createdAt"
            :published="true"
          />
        </div>
      </section>

      <nav v-if="surround?.prev || surround?.next" class="col-span-12 mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
        <NuxtLink
          v-if="surround?.prev"
          :to="surround.prev.path"
          class="group flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <span class="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
            <Icon name="mdi:arrow-left" size="14" />
            Previous
          </span>
          <span class="font-medium line-clamp-2">{{ surround.prev.title }}</span>
        </NuxtLink>
        <div v-else />

        <NuxtLink
          v-if="surround?.next"
          :to="surround.next.path"
          class="group flex flex-col gap-1 text-sm text-right text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <span class="flex items-center justify-end gap-1 text-xs font-semibold uppercase tracking-wide">
            Next
            <Icon name="mdi:arrow-right" size="14" />
          </span>
          <span class="font-medium line-clamp-2">{{ surround.next.title }}</span>
        </NuxtLink>
      </nav>
    </div>
  </div>
</template>
