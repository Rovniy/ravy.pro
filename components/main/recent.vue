<script lang="ts" setup>
import { homePage } from '~/data'

const { data } = await useAsyncData('recent-post', () =>
  queryCollection('content').where('path', 'LIKE', '/blogs/%').order('createdAt', 'DESC').limit(10).all(),
)

const formattedData = computed(() => {
  return data.value?.map((articles) => {
    return {
      path: articles.path,
      title: articles.title || 'no-title available',
      description: articles.description || 'no-description available',
      image: articles.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      createdAt: new Date(articles.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) || 'not-date-available',
      tags: articles.tags || [],
      published: articles.published || false,
    }
  }).filter(post => post.published).splice(0, 3)
})

useHead({
  title: homePage.meta.title,
  meta: [{ name: 'description', content: homePage.meta.description }],
})
</script>

<template>
  <section class="py-14 px-6">
    <div class="flex items-center gap-3 mb-8">
      <Icon name="mdi:sort-clock-descending-outline" size="1.4em" class="text-zinc-400 dark:text-zinc-500" />
      <h2 class="text-2xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
        Recent Posts
      </h2>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <template v-for="post in formattedData" :key="post.title">
        <BlogCard
          :path="post.path || ''"
          :title="post.title"
          :created-at="post.createdAt"
          :description="post.description"
          :image="post.image"
          :alt="post.alt"
          :og-image="post.ogImage"
          :tags="post.tags"
          :published="post.published"
        />
      </template>
      <template v-if="data?.length === 0">
        <BlogEmpty />
      </template>
    </div>
  </section>
</template>
