<script setup lang="ts">
import type { Screenshot } from '~/data/games'

// Screenshot strip for a project page, with a lightbox on click.
//
// The lightbox is a native <dialog>: Esc, focus trapping and the backdrop come
// from the browser, so nothing here has to reimplement them. Thumbnails go
// through @nuxt/image; the full-size view loads the original only when opened.

const props = defineProps<{
  images: Screenshot[]
  /** Game title, for the dialog's accessible name. */
  title: string
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const index = ref(0)
const current = computed(() => props.images[index.value]!)

// Landscape screenshots read best two to a row as 16:9 thumbnails; square ones
// fit three. Thumbnails share one aspect so mixed phone and tablet captures
// line up; the lightbox always shows the whole image.
const wide = computed(() => props.images.every(i => i.width / i.height > 1.2))

function open(i: number) {
  index.value = i
  dialog.value?.showModal()
}

function step(delta: number) {
  index.value = (index.value + delta + props.images.length) % props.images.length
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight')
    step(1)
  else if (e.key === 'ArrowLeft')
    step(-1)
}

// A click on the backdrop lands on the <dialog> element itself.
function onDialogClick(e: MouseEvent) {
  if (e.target === dialog.value)
    dialog.value?.close()
}
</script>

<template>
  <div>
    <ul class="mt-4 grid gap-3" :class="wide ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'">
      <li v-for="(shot, i) in images" :key="shot.src">
        <button
          type="button"
          class="group block w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 cursor-zoom-in"
          :aria-label="`Open screenshot: ${shot.alt}`"
          @click="open(i)"
        >
          <NuxtImg
            :src="shot.src"
            :alt="shot.alt"
            :width="shot.width"
            :height="shot.height"
            :sizes="wide ? '100vw sm:50vw lg:480px' : '50vw sm:33vw lg:320px'"
            format="webp"
            loading="lazy"
            decoding="async"
            class="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            :class="wide ? 'aspect-video' : 'aspect-square'"
          />
        </button>
      </li>
    </ul>

    <dialog
      ref="dialog"
      class="m-auto max-w-[min(96vw,1600px)] max-h-[92vh] bg-transparent p-0 backdrop:bg-black/85"
      :aria-label="`${title} screenshots`"
      @keydown="onKey"
      @click="onDialogClick"
    >
      <figure class="relative">
        <img
          :src="current.src"
          :alt="current.alt"
          :width="current.width"
          :height="current.height"
          class="block max-w-[96vw] max-h-[86vh] w-auto h-auto rounded-lg"
        >
        <figcaption class="mt-2 text-center text-sm text-slate-300">
          {{ current.alt }} · {{ index + 1 }} / {{ images.length }}
        </figcaption>
        <button type="button" class="absolute top-2 right-2 grid place-items-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer" aria-label="Close" @click="dialog?.close()">
          <Icon name="mdi:close" class="w-5 h-5" aria-hidden="true" />
        </button>
        <template v-if="images.length > 1">
          <button type="button" class="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer" aria-label="Previous screenshot" @click="step(-1)">
            <Icon name="mdi:chevron-left" class="w-6 h-6" aria-hidden="true" />
          </button>
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-10 h-10 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer" aria-label="Next screenshot" @click="step(1)">
            <Icon name="mdi:chevron-right" class="w-6 h-6" aria-hidden="true" />
          </button>
        </template>
      </figure>
    </dialog>
  </div>
</template>
