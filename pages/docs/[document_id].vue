<script setup lang="ts">
import { homePage, seoData } from '~/data'

const { path } = useRoute()

const { data: articles, error } = await useAsyncData(`blog-post-${path}`, () =>
  queryCollection('content').where('path', '=', path).first())

if (error.value || !articles?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: articles.value.title || 'no-title available',
  meta: [
    {
      name: 'description',
      content: articles.value.description || articles.value.title || 'no-description available',
    },
  ],
})

// No `Docs` breadcrumb parent: `/docs` has no page and returns 404, so the
// trail was advertising a broken URL to Google on all four documents. These are
// standalone legal pages — a hub for four of them would earn nothing — so the
// trail is Home → document.
useGenericPageSchema({
  url: `${seoData.mySite}${path}`,
  name: articles.value.title || 'Document',
  description: articles.value.description || articles.value.title || '',
  datePublished: articles.value.createdAt,
  dateModified: articles.value.lastUpdated || articles.value.createdAt,
})

// Generate OG Image
defineOgImage('Blog', {
  headline: 'Documentation',
  title: articles.value.title || 'no-title available',
  description: articles.value.description || articles.value.title || 'no-title available',
  link: homePage.og.link,
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
