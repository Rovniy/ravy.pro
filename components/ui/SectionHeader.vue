<script setup lang="ts">
const props = defineProps<{
  title: string
  eyebrow?: string
  /** Optional "view all" style link shown on the right. */
  to?: string
  linkLabel?: string
}>()
</script>

<template>
  <div class="mb-8">
    <div class="flex items-end justify-between gap-4">
      <div>
        <p v-if="props.eyebrow" class="inline-flex items-center gap-2 font-spacemono text-xs uppercase tracking-[0.12em] text-accent-600 dark:text-accent-400 mb-1.5">
          <span class="h-px w-5 bg-gradient-to-r from-accent-500 to-emerald-400" aria-hidden="true" />
          {{ props.eyebrow }}
        </p>
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {{ props.title }}
        </h2>
      </div>

      <slot name="action">
        <NuxtLink
          v-if="props.to"
          :to="props.to"
          class="group inline-flex items-center gap-1 mb-0.5 font-spacemono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          {{ props.linkLabel || 'View all' }}
          <Icon name="mdi:arrow-right" size="14" aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-0.5" />
        </NuxtLink>
      </slot>
    </div>

    <div class="relative mt-4 h-px bg-gradient-to-r from-slate-300/80 via-slate-200/60 to-transparent dark:from-slate-700/80 dark:via-slate-800/60" aria-hidden="true">
      <span class="absolute left-0 top-0 h-px w-14 bg-gradient-to-r from-accent-500 to-emerald-400" />
    </div>
  </div>
</template>
