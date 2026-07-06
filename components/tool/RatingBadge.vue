<script setup lang="ts">
import type { ToolRatingSummary } from '~/types/rating'
import { formatCompactCount } from '~/utils/rating'

defineProps<{ summary: ToolRatingSummary | null }>()
</script>

<template>
  <span
    v-if="summary"
    class="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400"
    :aria-label="`Rated ${summary.average} out of 5 based on ${summary.count} votes`"
  >
    <Icon name="mdi:star" class="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
    <span class="font-medium text-slate-700 dark:text-slate-300">{{ summary.average }}</span>
    <span>({{ formatCompactCount(summary.count) }})</span>
  </span>
  <span v-else class="inline-block h-4 w-16 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
</template>
