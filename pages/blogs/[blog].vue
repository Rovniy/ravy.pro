<script setup lang="ts">
import Image from '~/components/content/Image.vue'
import type { BlogPost } from '@/types/blog'
import { blogsPage, navbarData, seoData } from '~/data'

const { path } = useRoute()

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () => queryContent(path).findOne())

if (error.value || !articles?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const data = computed<BlogPost>(() => {
  return {
    title: articles.value?.title || 'no-title available',
    description: articles.value?.description || 'no-description available',
    image: articles.value?.image || '/not-found.png',
    alt: articles.value?.alt || articles.value?.description || 'no alter data available',
    ogImage: articles.value?.ogImage || articles.value?.image || '/not-found.png',
    date: articles.value?.date || 'not-date-available',
    tags: articles.value?.tags || [],
    published: articles.value?.published || false,
    theme: articles.value?.theme || seoData.theme,
    publishTime: articles.value?.publishTime || '2024-07-04T10:00:00Z',
    modifyTime: articles.value?.modifyTime || '2024-07-05T10:00:00Z',
    locale: articles.value?.locale || seoData.locale,
  }
})

useHead({
  title: data.value.title || '',
  meta: [
    { name: 'description', content: data.value.description },
    { property: 'article:author', content: seoData.author },
    { property: 'article:published_time', content: new Date(data.value.publishTime).toISOString() },
    { property: 'article:modified_time', content: new Date(data.value.modifyTime).toISOString() },
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

// Generate OG Image
defineOgImageComponent('Blog', {
  headline: blogsPage.og.title,
  title: data.value.title || '',
  description: data.value.description || '',
  link: data.value.ogImage || data.value.image,
  url: data.value.ogImage || data.value.image,
})
</script>

<template>
  <div class="px-6 container max-w-5xl mx-auto sm:grid grid-cols-12 gap-x-12">
    <div class="col-span-12 lg:col-span-9">
      <BlogHeader
        :title="data.title"
        :image="data.image"
        :alt="data.alt"
        :date="data.date"
        :description="data.description"
        :tags="data.tags"
      />
      <div
        class="prose prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
        prose-h1:no-underline max-w-5xl mx-auto prose-zinc dark:prose-invert prose-img:rounded-lg"
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
        class="text-white"
        :hashtags="hashTags"
        aria-label="Share with {network}"
      />
    </div>
  </div>
</template>
