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
  <div class="px-4">
    <div class="flex flex-row items-center space-x-3 pt-5 pb-3">
      <Icon name="mdi:instagram" size="2em" class="text-black dark:text-zinc-300" />

      <h2 class="text-4xl font-semibold text-black dark:text-zinc-300  ">
        Follow my Instagram
      </h2>
    </div>
    <div class="p-4 h-max">
      <iframe src="//lightwidget.com/widgets/deffe5a801815c1eba85e4fd4d39284d.html" scrolling="no" allowtransparency="true" class="aspect-square" style="width:100%;border:0;overflow:hidden;" />
    </div>
  </div>
</template>
