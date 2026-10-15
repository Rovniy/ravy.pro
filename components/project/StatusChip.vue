<script setup lang="ts">
import type { ProjectStatus } from '~/data/projects'
import { STATUS_LABEL } from '~/data/projects'

const props = defineProps<{ status: ProjectStatus }>()

const tone = computed(() => ({
  'out-now': 'border-ok/40 text-ok',
  'coming-soon': 'border-accent text-accent-ink',
  'in-development': 'border-warn/40 text-warn',
}[props.status]))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 border px-2.5 py-1 font-spacemono text-micro uppercase tracking-wider bg-bg/90"
    :class="tone"
  >
    <span class="w-1.5 h-1.5 bg-current" aria-hidden="true" />
    {{ STATUS_LABEL[props.status] }}
  </span>
</template>
