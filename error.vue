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
    <div class="py-5 container max-w-xl mx-auto flex flex-col items-center min-h-screen">
      <Logo404 />

      <a href="/" class="btn btn-primary">Go to home page</a>
    </div>
  </div>
</template>
