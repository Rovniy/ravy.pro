<script lang="ts" setup>
import { homePage } from '~/data'
import type { BlogPost } from '~/types/blog'

const { data } = await useAsyncData('trending-post', () =>
  queryContent('/blogs').limit(3).sort({ _id: -1, trending: 1 }).where({ trending: true }).find(),
) as { data: Ref<BlogPost[]> }

const formattedData = computed(() => {
  return data.value?.map((articles: BlogPost) => {
    return {
      path: articles._path,
      title: articles.title || 'no-title available',
      description: articles.description || 'no-description available',
      image: articles.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      createdAt: new Date(articles.createdAt).toLocaleDateString('en-US') || 'not-date-available',
      tags: articles.tags || [],
      published: articles.published || false,
    }
  })
})

useHead({
  title: homePage.meta.title,
  meta: [
    {
      name: 'description',
      content: homePage.meta.description,
    },
  ],
})
</script>

<template>
  <div class="pb-10 px-4">
    <div class="flex flex-row items-center space-x-3 pt-5 pb-3">
      <Icon name="mdi:star-outline" size="2em" class="text-black dark:text-zinc-300" />

      <h2 class="text-4xl font-semibold text-black dark:text-zinc-300  ">
        Trending Post
      </h2>
    </div>
    <div class="grid grid-cols-1 ">
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
      <template v-if="data?.length === 0">
        <BlogEmpty />
      </template>
    </div>
  </div>
</template>
