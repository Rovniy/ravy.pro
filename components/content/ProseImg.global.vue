<script setup lang="ts">
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
})

// Override of MDC's default ProseImg, which forwards only src/alt/width/height
// to NuxtImg — no `loading`, no `sizes`. The result was that every in-article
// image loaded eagerly at its full intrinsic resolution: one post shipped 12
// images / 618 kB on first paint, and a 5016px-wide source rendered a `2x`
// srcset asking IPX for 10032px (the same 341 kB file twice over).
//
// Two things fix it, and both have to stay:
//   - `loading="lazy"` so images below the fold wait their turn. The cover image
//     above the fold is a separate component (components/blog/Header.vue) and
//     keeps its eager/high-priority treatment, so nothing regresses LCP.
//   - `sizes` in @nuxt/image's `screenKey:size` syntax, capped at the real prose
//     column width. Passing raw CSS media queries here does NOT work — the
//     module collapses them to the last bare value (see the note in
//     components/blog/card.vue), which is how the rest of the site ended up
//     serving desktop-width images to phones.
//
// `width`/`height` are forwarded untouched on purpose: they carry the intrinsic
// aspect ratio, which is what keeps CLS at 0. Don't drop them to "fix" the
// oversized srcset — `sizes` is what bounds the request.

// Prose column measures ~720px at desktop widths (container `max-w-5xl` with
// `md:prose-lg`). x2 densities take the largest variant to 1440px.
const PROSE_SIZES = 'sm:100vw md:100vw lg:720px'

// Same baseURL handling as the component this replaces — a root-relative src
// must be rebased when the app is served from a sub-path.
const refinedSrc = computed(() => {
  if (props.src?.startsWith('/') && !props.src.startsWith('//')) {
    const base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL))
    if (base !== '/' && !props.src.startsWith(base))
      return joinURL(base, props.src)
  }
  return props.src
})
</script>

<template>
  <NuxtImg
    :src="refinedSrc"
    :alt="props.alt"
    :width="props.width"
    :height="props.height"
    :sizes="PROSE_SIZES"
    densities="x1 x2"
    loading="lazy"
    decoding="async"
  />
</template>
