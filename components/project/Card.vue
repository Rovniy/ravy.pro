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
  <UiCard :to="to" padding="none" @click="emit('click')">
    <div class="relative aspect-video overflow-hidden bg-panel-raised">
      <!-- Fallback ground while the image loads or if it fails: a slanted
           accent band, the same mark the hero uses. -->
      <div class="absolute inset-y-0 -left-[10%] w-[70%] bg-accent/15 -skew-x-10" aria-hidden="true" />
      <img
        v-if="!failed"
        :src="image"
        :alt="imageAlt"
        class="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
        @error="failed = true"
      >
      <div class="absolute left-3 top-3">
        <slot name="badge" />
      </div>
    </div>
    <div class="flex grow flex-col p-5">
      <p v-if="kicker" class="font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle">
        {{ kicker }}
      </p>
      <p class="mt-1 font-display font-extrabold uppercase text-2xl leading-none text-fg">
        {{ title }}
      </p>
      <p class="mt-2 grow text-sm leading-relaxed text-fg-muted">
        {{ tagline }}
      </p>
      <div class="mt-4 pt-3 border-t border-line flex items-center justify-between gap-3">
        <span class="font-spacemono text-micro text-fg-subtle truncate">{{ meta }}</span>
        <span class="inline-flex items-center gap-1 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
          Open
          <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </div>
    </div>
  </UiCard>
</template>
