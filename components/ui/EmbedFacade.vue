<script setup lang="ts">
import type { AnalyticsEvent } from '~/data/analytics'

// A third-party player that loads only when asked.
//
// Every page that uses this is prerendered. Mounting a Spotify or YouTube
// iframe up front costs each visitor a few hundred kB of someone else's
// JavaScript plus their cookies, before anyone has chosen to listen. The facade
// renders a poster and a play button; the iframe replaces it on click, with
// autoplay so that one click is enough.
//
// The iframe follows the same rules the studio enforces on post embeds: a
// `title`, and no width/height attributes — the wrapper's aspect class sizes it.
// Hosts must be allowed in `frame-src` (server/plugins/csp.ts).

const props = withDefaults(defineProps<{
  /** Embed URL. Autoplay is appended on click. */
  src: string
  /** Accessible name for the iframe and the play button. */
  title: string
  poster?: string
  posterAlt?: string
  /** `video` is 16:9; `spotify` is Spotify's fixed-height list player. */
  variant?: 'video' | 'spotify'
  event: AnalyticsEvent
  eventParams?: Record<string, string>
  /** Load straight away on mount — for a player the visitor just picked. */
  startActive?: boolean
}>(), {
  startActive: false,
  variant: 'video',
  poster: '',
  posterAlt: '',
  eventParams: () => ({}),
})

const active = ref(false)
const { track } = useAnalytics()

const iframeSrc = computed(() => {
  const sep = props.src.includes('?') ? '&' : '?'
  return `${props.src}${sep}autoplay=1`
})

function play() {
  active.value = true
  track(props.event, props.eventParams)
}

onMounted(() => {
  if (props.startActive)
    play()
})
</script>

<template>
  <!--
    Spotify picks its layout from the iframe's height: below 352px it falls
    back to the compact one-row player and leaves the rest of the frame empty.
    A border on the wrapper would eat those 2px, so the Spotify variant has
    none, and once loaded it drops its own background so nothing shows past
    the corners of the player. `color-scheme: normal` on the iframe matters
    too: in dark mode the page's scheme differs from the embed's, and the
    browser then paints an opaque white backdrop behind the whole frame.
  -->
  <div
    class="relative w-full overflow-hidden"
    :class="[
      variant === 'video' ? 'aspect-video border border-line' : 'h-[352px]',
      active && variant === 'spotify' ? 'bg-transparent' : 'bg-black',
    ]"
  >
    <iframe
      v-if="active"
      :src="iframeSrc"
      :title="title"
      class="absolute inset-0 w-full h-full border-0"
      style="color-scheme: normal"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowfullscreen
      loading="lazy"
      referrerpolicy="strict-origin-when-cross-origin"
    />
    <button
      v-else
      type="button"
      class="group absolute inset-0 w-full h-full cursor-pointer"
      :aria-label="`Play: ${title}`"
      @click="play"
    >
      <img
        v-if="poster"
        :src="poster"
        :alt="posterAlt"
        class="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-300 group-hover:opacity-100"
        loading="lazy"
        decoding="async"
      >
      <span
        v-else
        class="absolute inset-0 bg-panel-raised"
        aria-hidden="true"
      />
      <span class="absolute inset-0 grid place-items-center">
        <span class="grid place-items-center w-16 h-16 bg-white/90 text-fg transition-transform duration-200">
          <Icon name="mdi:play" class="w-32 h-32 text-4xl translate-x-0.5" aria-hidden="true" />
        </span>
      </span>
      <span class="scrim-b absolute left-0 right-0 bottom-0 px-4 pt-8 pb-3 text-left text-sm font-semibold text-white">
        {{ title }}
      </span>
    </button>
  </div>
</template>
