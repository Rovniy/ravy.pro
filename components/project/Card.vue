<script setup lang="ts">
// Card for a project on a hub page (/projects, /games, /music) and the home
// page. The image is 16:9 and cropped to fill; if it fails to load the card
// keeps a gradient instead of a broken-image icon.

defineProps<{
  to: string
  title: string
  tagline: string
  image: string
  imageAlt: string
  /** Mono eyebrow above the title ("Adventure platformer"). */
  kicker?: string
  /** Right-aligned mono line in the footer ("iOS · Android"). */
  meta?: string
}>()

const emit = defineEmits<{ click: [] }>()
const failed = ref(false)
</script>

<template>
  <NuxtLink
    v-spotlight
    :to="to"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
    @click="emit('click')"
  >
    <div class="relative aspect-video overflow-hidden bg-gradient-to-br from-accent-600/30 via-slate-800 to-emerald-700/30">
      <img
        v-if="!failed"
        :src="image"
        :alt="imageAlt"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-expo motion-safe:group-hover:scale-105"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      >
      <div class="absolute left-3 top-3">
        <slot name="badge" />
      </div>
    </div>
    <div class="flex grow flex-col p-5">
      <p v-if="kicker" class="eyebrow">
        {{ kicker }}
      </p>
      <p class="mt-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ title }}
      </p>
      <p class="mt-1.5 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {{ tagline }}
      </p>
      <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <span class="font-spacemono text-[11px] text-slate-500 dark:text-slate-400 truncate">{{ meta }}</span>
        <span class="inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
          Open
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
