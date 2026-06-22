<script setup lang="ts">
import { tagColorClass } from '@/utils/helper'

interface Props {
  title: string
  count: number
}

withDefaults(defineProps<Props>(), {
  title: 'No title available',
  count: 0,
})
</script>

<template>
  <NuxtLink
    :to="`/categories/${title.toLocaleLowerCase()}`"
    class="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold capitalize transition-transform duration-300 hover:scale-[1.05] focus-visible:scale-[1.05]"
    :class="tagColorClass(title.toLowerCase())"
  >
    <span>#{{ title }}</span>
    <span class="font-spacemono text-xs font-normal opacity-60">{{ count }}</span>
  </NuxtLink>
</template>
