<script setup lang="ts">
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
    class="group inline-flex items-center gap-2 px-4 py-2 border border-line-strong bg-panel font-display font-bold text-lg uppercase tracking-[0.04em] text-fg hover:border-accent hover:text-accent-ink transition-colors"
  >
    <span>#{{ title }}</span>
    <span class="font-spacemono text-xs font-normal text-fg-subtle tabular-nums">{{ count }}</span>
  </NuxtLink>
</template>
