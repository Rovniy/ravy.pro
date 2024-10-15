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

defineOgImageComponent('About', {
  headline: page404.og.headline,
  title: page404.og.title,
  description: page404.og.description,
})
</script>

<template>
  <div class="py-5">
    <div class="container max-w-xl mx-auto">
      <Logo404 />
    </div>
  </div>
</template>
