<script setup lang="ts">
import type { ProjectStatus } from '~/data/projects'
import { STATUS_LABEL } from '~/data/projects'

const props = defineProps<{ status: ProjectStatus }>()

const tone = computed(() => ({
  'out-now': 'border-emerald-300 text-emerald-700 dark:border-emerald-700/70 dark:text-emerald-400',
  'coming-soon': 'border-accent-300 text-accent-700 dark:border-accent-700/70 dark:text-accent-400',
  'in-development': 'border-amber-300 text-amber-700 dark:border-amber-700/70 dark:text-amber-400',
}[props.status]))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-spacemono text-[10px] uppercase tracking-wider bg-white/80 dark:bg-slate-950/70"
    :class="tone"
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ STATUS_LABEL[props.status] }}
  </span>
</template>
