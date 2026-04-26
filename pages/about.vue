<script setup lang="ts">
import { aboutPage } from '~/data'

const { data } = await useAsyncData('about', () =>
  queryCollection('content').where('path', '=', '/pages/about').first(),
)
if (!data?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: aboutPage.meta.title,
  meta: [
    {
      name: 'description',
      content: aboutPage.meta.description,
    },
  ],
})

defineOgImage('Blog', {
  headline: aboutPage.og.headline,
  title: aboutPage.og.title,
  description: aboutPage.og.description,
  link: aboutPage.og.link,
})
</script>

<template>
  <LayoutContainerOneCol>
    <ContentRenderer v-if="data" :value="data" />
  </LayoutContainerOneCol>
</template>
