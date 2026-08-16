<script setup lang="ts">
import { nowPage, seoData } from '~/data'

const { data } = await useAsyncData('now', () =>
  queryCollection('content').where('path', '=', '/pages/now').first())
if (!data?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: nowPage.meta.title,
  titleTemplate: '%s',
  meta: [
    {
      name: 'description',
      content: nowPage.meta.description,
    },
  ],
})

useGenericPageSchema({
  url: `${seoData.mySite}/now`,
  name: 'Now',
  description: nowPage.meta.description,
  // The freshness date is the whole point of a now page — surface it to
  // machines too, from the same frontmatter the visible "Updated" line states.
  dateModified: data.value?.lastUpdated,
})

defineOgImage('Blog', {
  headline: nowPage.og.headline,
  title: nowPage.og.title,
  description: nowPage.og.description,
  link: nowPage.og.link,
})
</script>

<template>
  <LayoutContainerOneCol>
    <ContentRenderer v-if="data" :value="data" />
  </LayoutContainerOneCol>
</template>
