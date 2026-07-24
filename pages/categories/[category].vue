<script lang="ts" setup>
import { makeFirstCharUpper } from '@/utils/helper'
import { categoriesPage, categoryDescriptions, seoData } from '~/data'

const route = useRoute()

const category = computed(() => {
  const name = route.params.category || ''
  let strName = ''

  if (Array.isArray(name))
    strName = name.at(0) || ''
  else strName = name
  return strName
})

const { data } = await useAsyncData(`category-data-${category.value}`, () => {
  return queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('tags', 'LIKE', `%"${category.value}"%`)
    .select('path', 'title', 'description', 'image', 'ogImage', 'alt', 'tags', 'createdAt', 'lastUpdated', 'published', 'trending')
    .order('createdAt', 'DESC')
    .all()
})
if (!data?.value?.length)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const formattedData = computed(() => {
  return data.value?.map((articles) => {
    return {
      path: articles.path,
      title: articles?.title || 'no-title available',
      description: articles?.description || 'no-description available',
      image: articles?.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      createdAt: articles?.createdAt || '',
      lastUpdated: articles?.lastUpdated || '',
      tags: articles?.tags || [],
      published: articles?.published || false,
      trending: articles?.trending || false,
    }
  })
})

const categoryDescription = computed(() =>
  categoryDescriptions[category.value]
  || `Posts tagged "${category.value}" by ${seoData.author}.`)

useHead({
  title: category.value,
  meta: [
    {
      name: 'description',
      content: categoryDescription.value,
    },
  ],
})

useCategoryPageSchema({
  url: `${seoData.mySite}/categories/${category.value}`,
  category: makeFirstCharUpper(category.value),
  description: categoryDescription.value,
  posts: (formattedData.value || []).map(p => ({
    path: p.path,
    title: p.title,
    image: p.image,
    ogImage: p.ogImage,
  })),
})

// Generate OG Image
defineOgImage('Blog', {
  headline: categoriesPage.og.headline,
  title: category.value,
  description: categoryDescription.value,
  link: categoriesPage.og.image,
})
</script>

<template>
  <div class="container max-w-5xl mx-auto text-slate-600 dark:text-slate-300 px-4">
    <CategoryTopic />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-14">
      <BlogCard
        v-for="post in formattedData"
        :key="post.title"
        :path="post?.path || ''"
        :title="post.title"
        :created-at="post.createdAt"
        :last-updated="post.lastUpdated"
        :description="post.description"
        :image="post.image"
        :alt="post.alt"
        :og-image="post.ogImage"
        :tags="post.tags"
        :published="post.published"
        :trending="post.trending"
      />

      <BlogEmpty v-if="data?.length === 0" />
    </div>
  </div>
</template>
