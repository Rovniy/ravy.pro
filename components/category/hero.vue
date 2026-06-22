<script setup lang="ts">
import { categoryPage } from '~/data'
</script>

<template>
  <div class="container mx-auto">
    <div class="grid grid-cols-1 sm:grid-cols-2 items-center">
      <div class="px-6">
        <p class="eyebrow mb-3">
          Topics
        </p>
        <h1 class="font-bold leading-tight tracking-tight text-4xl md:text-5xl mb-4 text-slate-900 dark:text-white">
          {{ categoryPage.title }}
        </h1>
        <p class="max-w-md text-slate-600 dark:text-slate-300">
          {{ categoryPage.description }}
        </p>
      </div>
      <div class="px-6 justify-self-center">
        <CreatureCategories />
      </div>
    </div>
  </div>
</template>
