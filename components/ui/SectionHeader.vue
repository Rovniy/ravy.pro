<script setup lang="ts">
/**
 * Section title: slanted accent marker, display heading, hard rule underneath.
 * `quiet` is the reading-zone variant (blog, TIL, tools, services): a straight
 * marker, smaller title, hairline rule. `index` prints a number before the
 * title — use it only when the sections really are a sequence.
 */
const props = defineProps<{
  title: string
  eyebrow?: string
  index?: number
  quiet?: boolean
  /** Optional "view all" style link shown on the right. */
  to?: string
  linkLabel?: string
}>()

const indexLabel = computed(() => props.index === undefined ? '' : String(props.index).padStart(2, '0'))
</script>

<template>
  <div
    class="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2"
    :class="props.quiet ? 'pb-3 border-b border-line' : 'pb-3.5 border-b-2 border-line-strong'"
  >
    <div class="flex items-center gap-3.5 min-w-0">
      <span
        class="shrink-0 bg-accent"
        :class="props.quiet ? 'w-1 h-6' : 'w-5 h-8 -skew-x-10'"
        aria-hidden="true"
      />
      <div class="min-w-0">
        <p v-if="props.eyebrow" class="font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle mb-1">
          {{ props.eyebrow }}
        </p>
        <h2
          class="font-display uppercase leading-none text-fg"
          :class="props.quiet ? 'text-3xl font-bold' : 'text-4xl font-extrabold'"
        >
          <span v-if="indexLabel" class="mr-2 font-semibold text-fg-subtle">{{ indexLabel }}</span>{{ props.title }}
        </h2>
      </div>
    </div>

    <slot name="action">
      <NuxtLink
        v-if="props.to"
        :to="props.to"
        class="group inline-flex items-center gap-1 font-spacemono text-micro uppercase tracking-[0.12em] text-fg-muted hover:text-accent-ink transition-colors"
      >
        {{ props.linkLabel || 'View all' }}
        <Icon name="mdi:arrow-right" size="14" aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-0.5" />
      </NuxtLink>
    </slot>
  </div>
</template>
