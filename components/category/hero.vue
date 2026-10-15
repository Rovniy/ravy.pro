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
        <h1 class="font-display font-extrabold uppercase leading-none text-5xl md:text-6xl mb-4 text-fg">
          {{ categoryPage.title }}
        </h1>
        <p class="max-w-md text-fg-muted">
          {{ categoryPage.description }}
        </p>
      </div>
      <div class="px-6 justify-self-center">
        <CreatureCategories />
      </div>
    </div>
  </div>
</template>
