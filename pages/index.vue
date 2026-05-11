<script lang="ts" setup>
import { homePage, navbarData } from '~/data'

useHead({
  title: homePage.meta.title,
  meta: [
    {
      name: 'description',
      content: homePage.meta.description,
    },
  ],
})

useHomeSchema({
  name: navbarData.homeTitle,
  description: homePage.meta.description,
})

defineOgImage('Blog', {
  headline: homePage.og.headline,
  title: homePage.og.title,
  description: homePage.og.description,
  link: homePage.og.link,
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600">
    <MainHero />
    <LazyMainRecent />
    <LazyMainTrending />
  </main>
</template>
