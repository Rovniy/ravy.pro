<script setup lang="ts">
import { TIL_TOPICS, tilTopicPath } from '~/data/til'

// Topic hubs as links, not filters: each hub is its own indexable page, so
// navigating to it is better for readers and search engines than a query param.

const props = defineProps<{
  counts: Record<string, number>
  active?: string
}>()

const topics = computed(() => TIL_TOPICS.filter(t => props.counts[t.id] || t.id === props.active))
</script>

<template>
  <nav aria-label="Note topics" class="flex flex-wrap gap-2">
    <NuxtLink
      to="/til"
      class="px-3 py-1 text-sm border transition-colors"
      :class="!active
        ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950'
        : 'border-line text-fg-muted hover:border-accent-400 hover:text-accent-500'"
    >
      All
    </NuxtLink>
    <NuxtLink
      v-for="t in topics"
      :key="t.id"
      :to="tilTopicPath(t.id)"
      class="inline-flex items-center gap-1.5 px-3 py-1 text-sm border transition-colors"
      :class="active === t.id
        ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950'
        : 'border-line text-fg-muted hover:border-accent-400 hover:text-accent-500'"
      :aria-current="active === t.id ? 'page' : undefined"
    >
      {{ t.name }}
      <span class="font-spacemono text-micro opacity-70">{{ counts[t.id] ?? 0 }}</span>
    </NuxtLink>
  </nav>
</template>
