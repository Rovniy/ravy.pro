<script lang="ts" setup>
import { categoriesPage } from '~/data'

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
  return queryContent('/blogs')
    .where({ tags: { $contains: category.value } })
    .sort({ _id: -1 })
    .find()
})
if (!data?.value?.length)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const formattedData = computed(() => {
  return data.value?.map((articles) => {
    return {
      path: articles._path,
      title: articles?.title || 'no-title available',
      description: articles?.description || 'no-description available',
      image: articles?.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      date: articles?.date || 'not-date-available',
      tags: articles?.tags || [],
      published: articles?.published || false,
    }
  })
})

useHead({
  title: category.value,
  meta: [
    {
      name: 'description',
      content: `You will find all the ${category.value} related post here`,
    },
  ],
})

// Generate OG Image
defineOgImageComponent('Blog', {
  headline: categoriesPage.og.headline,
  title: category.value?.toUpperCase(),
  description: `You will find all the ${category.value} related post here`,
  link: categoriesPage.og.image,
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600 px-4">
    <CategoryTopic />

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <BlogCard
        v-for="post in formattedData"
        :key="post.title"
        :path="post.path"
        :title="post.title"
        :date="post.date"
        :description="post.description"
        :image="post.image"
        :alt="post.alt"
        :og-image="post.ogImage"
        :tags="post.tags"
        :published="post.published"
      />

      <BlogEmpty v-if="data?.length === 0" />
    </div>
  </main>
</template>
