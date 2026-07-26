<script setup lang="ts">
// Repeated inline CTA band for service pages. Visually the dashed strip from the
// home page's "Suggest a tool" row, not a card — a repeated card reads as another
// sales block, a strip reads as a shortcut.
const props = withDefaults(defineProps<{
  label: string
  note: string
  /**
   * Target. A bare `#hash` scrolls within the current page; a path like
   * `/services#inquiry` navigates. NuxtLink handles both, and keeps the
   * cross-page case client-side instead of forcing a full reload.
   */
  anchor?: string
  /** Down-arrow reads right for an in-page jump, wrong for a cross-page link. */
  icon?: string
  telegramHref?: string
  telegramLabel?: string
  /** Analytics `location` param — keep distinct per placement. */
  location: string
}>(), {
  anchor: '#inquiry',
  icon: 'mdi:arrow-down',
  telegramLabel: 'Telegram',
})

// The arrow slides along its own axis, so the hint matches the direction it points.
const iconMotion = computed(() =>
  props.icon === 'mdi:arrow-down'
    ? 'group-hover:translate-y-0.5'
    : 'group-hover:translate-x-1',
)

const { trackCta } = useAnalytics()
</script>

<template>
  <div
    v-reveal
    class="group flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-5 py-4 transition-all duration-200 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-white/70 dark:hover:bg-slate-800/40"
  >
    <div class="min-w-0">
      <NuxtLink
        :to="props.anchor"
        class="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        @click="trackCta('inquiry', props.location)"
      >
        {{ props.label }}
        <Icon :name="props.icon" class="w-4 h-4 transition-transform duration-200" :class="iconMotion" aria-hidden="true" />
      </NuxtLink>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {{ props.note }}
      </p>
    </div>

    <!-- No click handler: plugins/analytics.client.ts auto-fires outbound_click. -->
    <a
      v-if="props.telegramHref"
      :href="props.telegramHref"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex items-center gap-1.5 shrink-0 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
    >
      <Icon name="fa:telegram" class="w-3.5 h-3.5" aria-hidden="true" />
      {{ props.telegramLabel }}
      <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
    </a>
  </div>
</template>
