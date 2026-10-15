<script setup lang="ts">
import type { PaletteSource } from '~/composables/useCommandPalette'

// Buttons that open the ⌘K palette. `header` is the compact pill in the top
// bar, `icon` the bare magnifier for the mobile bar, `hero` the search field on
// the home page with suggestion chips that open the palette pre-filled.

const props = withDefaults(defineProps<{
  variant?: 'header' | 'icon' | 'hero'
  suggestions?: string[]
}>(), { variant: 'header', suggestions: () => [] })

const { open } = useCommandPalette()
const modKey = useModKey()

const source = computed<PaletteSource>(() => props.variant === 'icon' ? 'mobile' : props.variant)
</script>

<template>
  <button
    v-if="variant === 'icon'"
    type="button"
    class="inline-flex items-center justify-center w-11 h-11 -my-1 hover:text-fg hover:cursor-pointer"
    aria-label="Search the site"
    aria-haspopup="dialog"
    @click="open(source)"
  >
    <Icon name="mdi:magnify" size="24" aria-hidden="true" />
  </button>

  <button
    v-else-if="variant === 'header'"
    type="button"
    class="group inline-flex items-center gap-2 h-9 pl-3 pr-1.5 border border-line bg-panel font-spacegrotesk normal-case tracking-normal text-sm font-medium text-fg-muted hover:border-accent hover:text-fg transition-colors hover:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    aria-label="Search the site"
    aria-haspopup="dialog"
    @click="open(source)"
  >
    <Icon name="mdi:magnify" size="18" aria-hidden="true" class="group-hover:text-accent-ink transition-colors" />
    <span>Search</span>
    <kbd class="cmdk-kbd ml-2">{{ modKey }} K</kbd>
  </button>

  <div v-else class="w-full max-w-xl">
    <button
      type="button"
      class="hero-search group relative w-full flex items-center gap-3 h-14 pl-5 pr-3 border-2 border-line-strong bg-panel text-left hover:border-accent transition-colors duration-200 hover:cursor-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
      aria-haspopup="dialog"
      @click="open(source)"
    >
      <span class="font-spacemono text-accent-ink" aria-hidden="true">&gt;</span>
      <span class="flex-1 min-w-0 truncate text-base text-fg-muted">
        Search posts, tools, games, music…
      </span>
      <span class="hero-caret" aria-hidden="true" />
      <kbd class="cmdk-kbd hidden sm:inline-flex">{{ modKey }} K</kbd>
    </button>
    <div v-if="suggestions.length" class="mt-3 flex flex-wrap items-center gap-2 font-spacemono text-xs">
      <span class="text-fg-muted">try</span>
      <button
        v-for="s in suggestions"
        :key="s"
        type="button"
        class="px-2.5 py-1 border border-line-strong text-fg-muted hover:border-accent hover:text-fg transition-colors hover:cursor-pointer"
        @click="open(source, s)"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* A blinking block caret: reads as "type here" without being an input. */
.hero-caret {
  width: 0.5rem;
  height: 1.1rem;
  background: var(--ui-accent);
}
@media (prefers-reduced-motion: no-preference) {
  .hero-caret {
    animation: hero-caret 1.1s steps(1) infinite;
  }
}
@keyframes hero-caret {
  50% { opacity: 0; }
}
</style>
