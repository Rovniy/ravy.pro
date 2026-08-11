<script setup lang="ts">
import { page404 } from '~/data'

// `noindex` is the point here: error pages render outside NuxtLayout and set no
// robots value of their own, so they inherited the site-wide
// `index, follow, max-image-preview:large…` and invited Google to index every
// 404 as a real page.
useHead({
  title: page404.meta.title,
  meta: [
    {
      name: 'description',
      content: page404.meta.description,
    },
    {
      name: 'robots',
      content: 'noindex, follow',
    },
  ],
})

defineOgImage('Blog', {
  headline: page404.og.headline,
  title: page404.og.title,
  description: page404.og.description,
  link: page404.og.link,
})
</script>

<template>
  <div class="min-h-screen">
    <div class="py-5 container max-w-xl mx-auto flex flex-col items-center justify-center gap-8 min-h-screen text-center">
      <Logo404 />

      <!-- The page had no h1 at all — the 404 glyph is decorative artwork, so
           the heading has to be real text even though the art carries it
           visually. -->
      <h1 class="sr-only">
        {{ page404.og.headline }} — {{ page404.meta.description }}
      </h1>

      <a
        href="/"
        class="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
      >
        <Icon name="mdi:arrow-left" size="18" aria-hidden="true" />
        Go to home page
      </a>
    </div>
  </div>
</template>
