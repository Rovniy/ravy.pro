<script lang="ts" setup>
import type { BlogPostMeta } from '~/utils/blog-post'
import { makeFirstCharUpper } from '@/utils/helper'
import { categoriesPage, categoryDescriptions, categoryNames, seoData } from '~/data'
import { toCardData } from '~/utils/blog-post'

const route = useRoute()

const category = computed(() => {
  const name = route.params.category || ''
  let strName = ''

  if (Array.isArray(name))
    strName = name.at(0) || ''
  else strName = name
  return strName
})

// The whole list, then filtered by tag in JS. The previous
// `where('tags', 'LIKE', '%"tag"%')` was a substring match against the
// serialised array, so a tag that is a prefix of another would have matched
// both; and there is no per-tag query left to make now that the index is a
// single document.
const { data } = await useAsyncData('blog-post-list', () =>
  $fetch<BlogPostMeta[]>('/api/blog/posts'))

const posts = computed(() => (data.value ?? []).filter(p => p.tags.includes(category.value)))

if (!posts.value.length)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const formattedData = computed(() => posts.value.map(toCardData))

const categoryDescription = computed(() =>
  categoryDescriptions[category.value]
  || `Posts tagged "${category.value}" by ${seoData.author}.`)

// The raw slug is not a title — it shipped as `diva-rogue - Andrei Rovnyi` in
// search results and every share. `makeFirstCharUpper` is the fallback for a tag
// that hasn't been given a display name yet.
const categoryLabel = computed(() =>
  categoryNames[category.value] || makeFirstCharUpper(category.value))

useHead({
  title: categoryLabel.value,
  meta: [
    {
      name: 'description',
      content: categoryDescription.value,
    },
  ],
})

useCategoryPageSchema({
  url: `${seoData.mySite}/categories/${category.value}`,
  category: categoryLabel.value,
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
  title: categoryLabel.value,
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

      <BlogEmpty v-if="!formattedData.length" />
    </div>
  </div>
</template>
