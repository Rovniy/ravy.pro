<script lang="ts" setup>
interface Props {
  image: string
  alt: string
  caption?: string
  profileUrl: string
}

withDefaults(defineProps<Props>(), {
  caption: '',
})
</script>

<template>
  <a
    :href="profileUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="alt"
    class="aspect-square group relative block overflow-hidden rounded-sm bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 focus:outline-none"
  >
    <NuxtImg
      loading="lazy"
      class="w-full object-cover object-center group-hover:scale-105 group-hover:brightness-105 transition-all duration-500"
      width="250"
      height="350"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
      densities="x1 x2"
      :src="image"
      :alt="alt"
    />

    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent pointer-events-none" />

    <p
      v-if="caption"
      class="absolute bottom-3 inset-x-0 px-3 pt-3 text-xs sm:text-sm text-white line-clamp-2 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300"
    >
      {{ caption }}
    </p>
  </a>
</template>
