<script lang="ts" setup>
import { homePage } from '~/data'
import type { BlogPost } from '~/types/blog'

const { data } = await useAsyncData('trending-post', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/blogs/%')
    .where('trending', '=', true)
    .order('createdAt', 'DESC')
    .limit(3)
    .all(),
) as { data: Ref<BlogPost[]> }

const formattedData = computed(() => {
  return data.value?.map((articles: BlogPost) => {
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
  })
})

useHead({
  title: homePage.meta.title,
  meta: [{ name: 'description', content: homePage.meta.description }],
})
</script>

<template>
  <section v-if="formattedData?.length" class="py-14 px-6 border-t dark:border-zinc-800">
    <div class="flex items-center gap-3 mb-8">
      <Icon name="mdi:star-outline" size="1.4em" class="text-zinc-400 dark:text-zinc-500" />
      <h2 class="text-2xl font-bold text-zinc-800 dark:text-zinc-200 tracking-tight">
        Trending Posts
      </h2>
    </div>

    <div class="flex flex-col gap-4">
      <template v-for="post in formattedData" :key="post.title">
        <ArchiveCard
          :path="post.path"
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
    </div>
  </section>
</template>
