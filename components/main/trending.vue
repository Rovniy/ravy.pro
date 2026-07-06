<script lang="ts" setup>
import type { BlogPost } from '~/types/blog'
import { homePage } from '~/data'

const { data } = await useAsyncData('trending-post', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('trending', '=', true)
    .select('path', 'title', 'description', 'image', 'ogImage', 'alt', 'tags', 'createdAt', 'lastUpdated', 'published', 'trending')
    .order('createdAt', 'DESC')
    .limit(3)
    .all()) as { data: Ref<BlogPost[]> }

const formattedData = computed(() => {
  return data.value?.map((articles: BlogPost) => {
    return {
      // @ts-expect-error path is exist
      path: articles.path,
      title: articles.title || 'no-title available',
      description: articles.description || 'no-description available',
      image: articles.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      createdAt: articles.createdAt || '',
      lastUpdated: articles.lastUpdated || '',
      tags: articles.tags || [],
      published: articles.published || false,
    }
  })
})

useHead({
  title: homePage.meta.title,
  meta: [{ name: 'description', content: homePage.meta.description }],
})
</script>

<template>
  <section v-if="formattedData?.length" class="py-14 px-6">
    <UiSectionHeader eyebrow="Popular" title="Trending Posts" />

    <div class="flex flex-col gap-4">
      <template v-for="post in formattedData" :key="post.title">
        <BlogCard
          horizontal
          :path="post.path"
          :title="post.title"
          :created-at="post.createdAt"
          :last-updated="post.lastUpdated"
          :description="post.description"
          :image="post.image"
          :alt="post.alt"
          :og-image="post.ogImage"
          :tags="post.tags"
          :published="post.published"
          trending
        />
      </template>
    </div>
  </section>
</template>
