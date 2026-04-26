<script setup lang="ts">
import Image from '~/components/content/Image.vue'
import type { BlogPost } from '@/types/blog'
import { blogsPage, navbarData, seoData } from '~/data'

const { path } = useRoute()

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () =>
  queryCollection('content').where('path', '=', path).first(),
)

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

function countWords(node: any): number {
  if (node.type === 'text') return node.value?.split(/\s+/).filter(Boolean).length ?? 0
  if (Array.isArray(node.children)) return node.children.reduce((s: number, c: any) => s + countWords(c), 0)
  return 0
}

const readingTime = computed(() => Math.max(1, Math.ceil(countWords(articles.value?.body ?? {}) / 200)))

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
    createdAt: new Date(articles.value?.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }),
    lastUpdated: articles.value?.lastUpdated || new Date().toISOString(),
    locale: articles.value?.locale || seoData.locale,
  }
})

useHead({
  title: data.value.title || '',
  meta: [
    { name: 'description', content: data.value.description },
    { property: 'article:author', content: seoData.author },
    { property: 'article:published_time', content: data.value?.createdAt || new Date().toISOString() },
    { property: 'article:modified_time', content: data.value?.lastUpdated || data.value?.createdAt || new Date().toISOString() },
    { property: 'article:section', content: data.value.tags?.at(0) },
    { property: 'article:tag', content: data.value.theme },
    { property: 'og:site_name', content: navbarData.homeTitle },
    { property: 'og:type', content: 'article' },
    { property: 'og:url', content: `${seoData.mySite}${path}` },
    { property: 'og:title', content: data.value.title },
    { property: 'og:description', content: data.value.description },
    { property: 'og:image', content: `${seoData.mySite}${data.value.ogImage || data.value.image}` },
    { property: 'og:image:alt', content: data.value.description },
    { property: 'og:image:width', content: seoData.ogImageWidth },
    { property: 'og:image:height', content: seoData.ogImageHeight },
    { property: 'og:locale', content: data.value.locale },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: seoData.twitterHandle },
    { name: 'twitter:url', content: `${seoData.mySite}/${path}` },
    { name: 'twitter:title', content: data.value.title },
    { name: 'twitter:description', content: data.value.description },
    { name: 'twitter:image', content: `${seoData.mySite}${data.value.ogImage || data.value.image}` },
  ],
  link: [
    {
      rel: 'canonical',
      href: `${seoData.mySite}/${path}`,
    },
    {
      rel: 'preload',
      as: 'image',
      href: data.value.image,
      type: 'image/webp',
    },
  ],
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
    <BlogReadingProgress />

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
          prose-h1:no-underline max-w-5xl mx-auto prose-zinc dark:prose-invert prose-img:rounded-lg prose-img:mx-auto prose-img:block"
        >
          <ContentRenderer v-if="articles" :value="articles" :components="{ Image }">
            <template #empty>
              <p>No content found.</p>
            </template>
          </ContentRenderer>
        </div>
      </div>

      <BlogToc :articles="articles" />

      <div class="flex flex-row flex-wrap md:flex-nowrap mt-10 gap-2">
        <LazySocialShare
          v-for="network in ['facebook', 'twitter', 'linkedin', 'telegram', 'email']"
          :key="network"
          :network="network"
          :url="`${seoData.mySite}${path}`"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors"
          :hashtags="hashTags"
          aria-label="Share with {network}"
        />
      </div>

      <nav v-if="surround?.prev || surround?.next" class="col-span-12 mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-4">
        <NuxtLink
          v-if="surround?.prev"
          :to="surround.prev.path"
          class="group flex flex-col gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
          class="group flex flex-col gap-1 text-sm text-right text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
