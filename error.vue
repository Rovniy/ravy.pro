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
  <!-- error.vue replaces app.vue, so it sets the ground and face itself. -->
  <div class="min-h-screen bg-bg text-fg font-spacegrotesk">
    <div class="py-5 px-6 mx-auto max-w-xl flex flex-col items-center justify-center gap-8 min-h-screen text-center">
      <Logo404 />

      <!-- The page had no h1 at all — the 404 glyph is decorative artwork, so
           the heading has to be real text even though the art carries it
           visually. -->
      <h1 class="sr-only">
        {{ page404.og.headline }} — {{ page404.meta.description }}
      </h1>

      <a href="/" class="skew-box btn btn-primary">
        <Icon name="mdi:arrow-left" size="18" aria-hidden="true" />
        Go to home page
      </a>
    </div>
  </div>
</template>
