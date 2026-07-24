<script lang="ts" setup>
interface Props {
  image: string
  alt: string
  caption?: string
  profileUrl: string
  /** 2×2 hero tile in the bento grid — gets a "Latest" badge and a larger source image. */
  featured?: boolean
  /** Position in the grid, rendered as a mono data-layer index ("01", "02", …). */
  index?: number
}

const props = withDefaults(defineProps<Props>(), {
  caption: '',
  featured: false,
  index: 0,
})

const indexLabel = computed(() => String(props.index + 1).padStart(2, '0'))
</script>

<template>
  <a
    :href="profileUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="alt"
    class="group relative block aspect-square overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-900 ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300 hover:ring-accent-400/60 dark:hover:ring-accent-500/50 hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-accent-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
    :class="featured ? 'col-span-2 row-span-2' : ''"
  >
    <NuxtImg
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-expo motion-safe:group-hover:scale-[1.06] group-hover:saturate-[1.15]"
      :width="featured ? 500 : 250"
      :height="featured ? 500 : 250"
      :sizes="featured
        ? '(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 500px'
        : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px'"
      densities="x1 x2"
      :src="image"
      :alt="alt"
    />

    <!-- Depth veil: barely-there at rest, cinematic on hover so the caption reads. -->
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent" aria-hidden="true" />
    <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

    <!-- Live badge on the hero tile — same data-layer language as the hero status pill. -->
    <span
      v-if="featured"
      class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 text-white/90 backdrop-blur-md font-spacemono text-[10px] uppercase tracking-wider"
    >
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
      Latest
    </span>

    <!-- Frosted Instagram glyph, revealed on hover. -->
    <span
      class="absolute top-3 right-3 grid place-items-center w-8 h-8 rounded-full bg-white/15 text-white backdrop-blur-md opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-expo"
      aria-hidden="true"
    >
      <Icon name="mdi:instagram" size="15" />
    </span>

    <!-- Caption block slides up: mono index line, then the caption itself. -->
    <div
      class="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-expo pointer-events-none"
    >
      <p class="font-spacemono text-[10px] uppercase tracking-[0.14em] text-emerald-300/90 mb-1">
        {{ indexLabel }} · @ravygo
      </p>
      <p v-if="caption" class="text-xs text-white/95 line-clamp-2" :class="featured ? 'sm:text-sm sm:line-clamp-3' : ''">
        {{ caption }}
      </p>
    </div>
  </a>
</template>
