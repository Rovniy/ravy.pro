<script setup lang="ts">
import { linksPage } from '~/data'

const { data } = await useAsyncData('links', () =>
  queryCollection('content').where('path', '=', '/pages/links').first(),
)
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
defineOgImage('Blog', {
  headline: linksPage.og.headline,
  title: linksPage.og.title,
  description: linksPage.og.description,
  link: linksPage.og.link,
  url: linksPage.og.link,
})
</script>

<template>
  <LayoutContainerTwoCol>
    <ContentRenderer :value="data" />

    <template #col>
      <BlogToc :articles="data" />
    </template>
  </LayoutContainerTwoCol>
</template>

<style scoped>

</style>
