<script lang="ts" setup>
import { homePage } from '~/data'

useHead({
  title: homePage.meta.title,
  meta: [
    {
      name: 'description',
      content: homePage.meta.description,
    },
  ],
})

defineOgImageComponent('Blog', {
  headline: homePage.og.headline,
  title: homePage.og.title,
  description: homePage.og.description,
  link: homePage.og.link,
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600">
    <MainHero />
    <MainRecent />
    <LazyMainTrending />
  </main>
</template>
