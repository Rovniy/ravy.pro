<script setup lang="ts">
import { homePage } from '~/data'

const { data } = await useAsyncData('docs', () => queryContent('docs/tiny-boo-privacy-policy').findOne())
if (!data?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: 'Tiny Boo Privacy Policy',
  meta: [
    {
      name: 'description',
      content: 'This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information',
    },
  ],
})

// Generate OG Image
defineOgImageComponent('Blog', {
  headline: 'Documentation',
  title: 'Tiny Boo Privacy Policy',
  description: 'This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information',
  link: homePage.og.link,
  url: homePage.og.link,
})
</script>

<template>
  <DocsContent :article="data" />
</template>
