<script setup lang="ts">
import { page404 } from '~/data'

useHead({
  title: page404.meta.title,
  meta: [
    {
      name: 'description',
      content: page404.meta.description,
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
