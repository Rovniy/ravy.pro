<script setup lang="ts">
import { publicServices } from '~/data'

// Links a tool to the post about building it. Resolves the pair from
// `publicServices` by route, so a tool page just drops <ToolStoryLink /> in and
// nothing has to be kept in sync at the call site — same resolution style as
// <ToolRatingWidget>, which finds its tool id from the route too.
//
// Renders nothing when the tool has no `story`, so it is safe on every tool page.
const route = useRoute()

const story = computed(() =>
  publicServices.find(s => s.path === route.path)?.story ?? null)
</script>

<template>
  <NuxtLink
    v-if="story"
    :to="story"
    class="group inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
  >
    <Icon name="mdi:notebook-outline" class="w-3.5 h-3.5" aria-hidden="true" />
    How and why I built this
    <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
  </NuxtLink>
</template>
