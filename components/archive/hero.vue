<script setup lang="ts">
import { blogsPage } from '~/data'
</script>

<template>
  <div class="container mx-auto mb-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 items-center">
      <div class="px-6">
        <p class="eyebrow mb-3">
          Writing
        </p>
        <h1 class="font-bold leading-tight tracking-tight text-4xl md:text-5xl mb-4 text-slate-900 dark:text-white">
          {{ blogsPage.content.title }}
        </h1>
        <p class="max-w-md text-slate-600 dark:text-slate-300">
          {{ blogsPage.content.description }}
        </p>
      </div>
      <div class="px-6 justify-self-center">
        <CreatureBlogs />
      </div>
    </div>
  </div>
</template>
