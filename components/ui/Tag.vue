<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/**
 * Mono label chip. `accent` is the slanted loud badge (audience, "featured");
 * `neutral` is a plain outlined tag (topics, categories); the status tones mean
 * exactly what they say and are never decoration.
 */
const props = withDefaults(defineProps<{
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'danger'
  to?: RouteLocationRaw
}>(), {
  tone: 'neutral',
})

const NuxtLink = resolveComponent('NuxtLink')

const toneClasses: Record<NonNullable<typeof props.tone>, string> = {
  neutral: 'border border-line-strong text-fg-muted',
  accent: 'skew-box font-bold text-accent-fg before:bg-accent',
  ok: 'border border-ok/45 text-ok',
  warn: 'border border-warn/45 text-warn',
  danger: 'border border-danger/45 text-danger',
}
</script>

<template>
  <component
    :is="props.to ? NuxtLink : 'span'"
    :to="props.to"
    class="inline-flex items-center gap-1.5 px-2 py-1 font-spacemono text-micro uppercase tracking-[0.08em] whitespace-nowrap"
    :class="[toneClasses[props.tone], { 'hover:border-fg hover:text-fg transition-colors': props.to && props.tone === 'neutral' }]"
  >
    <slot />
  </component>
</template>
