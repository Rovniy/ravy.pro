<script setup lang="ts">
import type { BlogPost } from '@/types/blog'
import Image from '~/components/content/Image.vue'
import { blogsPage, navbarData, seoData } from '~/data'
import { EVENTS } from '~/data/analytics'
import { countWords, readingTimeMinutes } from '~/utils/count-words'
import { formatBlogDate } from '~/utils/helper'

const { path } = useRoute()

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () =>
  queryCollection('content').where('path', '=', path).first())

if (error.value || !articles?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const { data: surround } = await useAsyncData(`blog-surround-${path}`, async () => {
  const all = await queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .order('createdAt', 'ASC')
    .select('path', 'title')
    .all()
  const idx = all.findIndex(p => p.path === path)
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  }
})

// Topically related posts (shared tag), newest first — chronological
// prev/next alone doesn't surface the rest of a series.
const { data: related } = await useAsyncData(`blog-related-${path}`, async () => {
  const tags = articles.value?.tags ?? []
  if (!tags.length)
    return []
  const all = await queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .order('createdAt', 'DESC')
    .select('path', 'title', 'description', 'image', 'alt', 'tags', 'createdAt')
    .all()
  return all
    .filter(post => post.path !== path && (post.tags ?? []).some((tag: string) => tags.includes(tag)))
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
    theme: articles.value?.theme || seoData.theme,
    createdAt: formatBlogDate(articles.value?.createdAt),
    lastUpdated: articles.value?.lastUpdated || new Date().toISOString(),
    locale: articles.value?.locale || seoData.locale,
  }
})

useHead({
  title: data.value.title || '',
  meta: [
    { name: 'description', content: data.value.description },
    { property: 'article:author', content: seoData.author },
    { property: 'article:published_time', content: articles.value?.createdAt || new Date().toISOString() },
    { property: 'article:modified_time', content: articles.value?.lastUpdated || articles.value?.createdAt || new Date().toISOString() },
    { property: 'article:section', content: data.value.tags?.at(0) },
    { property: 'article:tag', content: data.value.theme },
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
  createdAt: articles.value?.createdAt || new Date().toISOString(),
  lastUpdated: articles.value?.lastUpdated || articles.value?.createdAt,
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
      <div class="col-span-12 lg:col-span-9">
        <BlogHeader
          :title="data.title"
          :image="data.image"
          :alt="data.alt"
          :created-at="data.createdAt"
          :description="data.description"
          :tags="data.tags"
          :reading-time="readingTime"
        />
        <div
          class="prose prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
          prose-h1:no-underline mx-auto prose-slate dark:prose-invert prose-img:rounded-lg prose-img:mx-auto prose-img:block"
        >
          <ContentRenderer v-if="articles" :value="articles" :components="{ Image }">
            <template #empty>
              <p>No content found.</p>
            </template>
          </ContentRenderer>
        </div>
      </div>

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
