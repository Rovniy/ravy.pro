<script setup lang="ts">
import { linksPage } from '~/data'

const { data } = await useAsyncData('links', () => queryContent('pages/links').findOne())
if (!data?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: linksPage.meta.title,
  meta: [
    {
      name: 'description',
      content: linksPage.meta.description,
    },
  ],
})

// Generate OG Image
defineOgImageComponent('Blog', {
  headline: linksPage.og.headline,
  title: linksPage.og.title,
  description: linksPage.og.description,
  link: linksPage.og.link,
  url: linksPage.og.link,
})
</script>

<template>
  <div class="px-6 container max-w-5xl mx-auto sm:grid grid-cols-12 gap-x-12 ">
    <div class="col-span-12 lg:col-span-9">
      <div
        class="prose prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
        prose-h1:no-underline max-w-5xl mx-auto prose-zinc dark:prose-invert prose-img:rounded-lg"
      >
        <ContentRenderer :value="data" />
      </div>
    </div>

    <BlogToc :articles="data" />
  </div>
</template>

<style scoped>

</style>
