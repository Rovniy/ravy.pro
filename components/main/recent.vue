<script lang="ts" setup>
import { homePage } from '~/data'

const { data } = await useAsyncData('recent-post', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('published', '=', true)
    .select('path', 'title', 'description', 'image', 'ogImage', 'alt', 'tags', 'createdAt', 'lastUpdated', 'published', 'trending')
    .order('createdAt', 'DESC')
    .limit(3)
    .all())

const formattedData = computed(() => {
  return data.value?.map((articles) => {
    return {
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
      trending: articles.trending || false,
    }
  })
})

useHead({
  title: homePage.meta.title,
  meta: [{ name: 'description', content: homePage.meta.description }],
})
</script>

<template>
  <section class="py-14 px-6">
    <UiSectionHeader eyebrow="Writing" title="Recent Posts" to="/blogs" />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="post in formattedData" :key="post.title">
        <BlogCard
          :path="post.path || ''"
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
      </template>
      <template v-if="data?.length === 0">
        <BlogEmpty />
      </template>
    </div>
  </section>
</template>
