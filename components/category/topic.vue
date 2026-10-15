<script setup lang="ts">
import { makeFirstCharUpper } from '@/utils/helper'

const route = useRoute()

// take category from route params & make first char upper
const category = computed(() => {
  const name = route.params.category || ''
  let strName = ''

  if (Array.isArray(name))
    strName = name.at(0) || ''
  else strName = name
  return makeFirstCharUpper(strName)
})
</script>

<template>
  <header class="py-10 sm:py-14">
    <p class="eyebrow mb-4">
      Category
    </p>
    <h1 class="font-display font-extrabold uppercase text-5xl sm:text-6xl leading-none text-fg">
      <span class="text-accent-ink">#</span>{{ category }}
    </h1>
  </header>
</template>
