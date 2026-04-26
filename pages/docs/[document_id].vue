<script setup lang="ts">
import { homePage } from '~/data'

const { path } = useRoute()

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () =>
  queryCollection('content').where('path', '=', path).first(),
)

if (error.value || !articles?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: articles.value.title || 'no-title available',
  meta: [
    {
      name: 'description',
      content: articles.value.title || 'no-description available',
    },
  ],
})

// Generate OG Image
defineOgImage('Blog', {
  headline: 'Documentation',
  title: articles.value.title || 'no-title available',
  description: articles.value.title || 'no-title available',
  link: homePage.og.link,
  url: homePage.og.link,
})
</script>

<template>
  <LayoutContainerOneCol>
    <ContentRenderer v-if="articles" :value="articles">
      <template #empty>
        <p>No content found.</p>
      </template>
    </ContentRenderer>
  </LayoutContainerOneCol>
</template>
