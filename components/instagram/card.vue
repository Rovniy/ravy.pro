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
    class="group relative block aspect-square overflow-hidden bg-panel-raised ring-1 ring-line transition-shadow duration-200 hover:ring-2 hover:ring-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    :class="featured ? 'col-span-2 row-span-2' : ''"
  >
    <!--
      `sizes` must use @nuxt/image's `screenKey:size` syntax. Raw CSS media
      queries look right but the module collapses them to the last bare value,
      so a phone was downloading the 240px/500px desktop variant. `format="webp"`
      is explicit because these are the only unoptimised JPEGs on the site
      (Instagram CDN originals, ~1.2 MB) and the module-level `image.format`
      option only feeds NuxtPicture, not NuxtImg.
    -->
    <NuxtImg
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover object-center"
      :width="featured ? 500 : 250"
      :height="featured ? 500 : 250"
      :sizes="featured
        ? 'sm:100vw md:66vw lg:500px'
        : 'sm:50vw md:33vw lg:240px'"
      densities="x1 x2"
      format="webp"
      :src="image"
      :alt="alt"
    />

    <!-- Scrim on hover so the caption reads. -->
    <div class="scrim-b absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

    <!-- Badge on the lead tile. -->
    <span
      v-if="featured"
      class="absolute top-3 left-3"
    >
      <UiTag tone="accent">Latest</UiTag>
    </span>

    <!-- Instagram glyph, revealed on hover. -->
    <span
      class="absolute top-3 right-3 grid place-items-center w-8 h-8 bg-accent text-accent-fg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      aria-hidden="true"
    >
      <Icon name="mdi:instagram" size="15" />
    </span>

    <!-- Caption block slides up: mono index line, then the caption itself. -->
    <div
      class="absolute inset-x-0 bottom-0 p-3 sm:p-4 translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-expo pointer-events-none"
    >
      <p class="font-spacemono text-micro uppercase tracking-[0.14em] text-accent-400 mb-1">
        {{ indexLabel }} · @ravygo
      </p>
      <p v-if="caption" class="text-xs text-white/95 line-clamp-2" :class="featured ? 'sm:text-sm sm:line-clamp-3' : ''">
        {{ caption }}
      </p>
    </div>
  </a>
</template>
