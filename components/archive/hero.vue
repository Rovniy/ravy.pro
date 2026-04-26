<script setup lang="ts">
import { blogsPage } from '~/data'
</script>

<template>
  <div class="container mx-auto mb-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 items-center">
      <div class="px-6">
        <h1 class="font-semibold leading-tight text-4xl md:text-5xl my-5 bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text text-transparent">
          {{ blogsPage.content.title }}
        </h1>
        <p class="dark:text-zinc-300">
          {{ blogsPage.content.description }}
        </p>
      </div>
      <div class="px-6 justify-self-center">
        <CreatureBlogs />
      </div>
    </div>
  </div>
</template>
