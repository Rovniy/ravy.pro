<script lang="ts" setup>
import { daysSince, formatBlogDate, tagColorClass } from '~/utils/helper'

interface Props {
  path?: string
  title?: string
  description?: string
  image?: string
  alt?: string
  ogImage?: string
  tags?: Array<string>
  published?: boolean
  trending?: boolean
  createdAt?: string
  lastUpdated?: string
  /** Horizontal list-row layout (image left, content right); default is a vertical grid card. */
  horizontal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  description: 'no-description',
  image: '/not-found.png',
  alt: 'no-alt',
  ogImage: '/not-found.png',
  tags: () => [],
  published: false,
  trending: false,
  createdAt: '',
  lastUpdated: '',
  horizontal: false,
})

const displayDate = computed(() => formatBlogDate(props.createdAt))

// The New/Updated badges are relative to *now*, and every page that renders this
// card is prerendered — so the build-time answer gets frozen into the static HTML
// and drifts as posts age past the 30-day line. Vue then reports "Hydration
// completed but contains mismatches" on the client. Gate both on `mounted` so the
// server output is deterministic (no freshness badges) and the client computes the
// truthful answer right after hydration. `trending` is a prop, so it stays in SSR.
const mounted = useMounted()

const isNew = computed(() => mounted.value && daysSince(props.createdAt) <= 30)
const isUpdated = computed(() => {
  if (!mounted.value || !props.lastUpdated || !props.createdAt)
    return false
  const created = new Date(props.createdAt).getTime()
  const updated = new Date(props.lastUpdated).getTime()
  if (Number.isNaN(created) || Number.isNaN(updated))
    return false
  const gapDays = (updated - created) / 86_400_000
  return gapDays >= 7 && daysSince(props.lastUpdated) <= 30
})
const primaryTag = computed(() => props.tags?.[0])
const restTags = computed(() => props.tags?.slice(1) ?? [])
</script>

<template>
  <article
    v-spotlight
    class="group relative border border-slate-200/80 dark:border-white/10 overflow-hidden rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-900/10 dark:hover:shadow-accent-500/10 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-1.5 hover:border-accent-300 dark:hover:border-accent-500/40 focus-within:ring-2 focus-within:ring-accent-400"
    :class="horizontal ? 'grid grid-cols-1 sm:grid-cols-10' : 'flex flex-col'"
  >
    <NuxtLink
      :to="path"
      :aria-label="title"
      class="absolute inset-0 z-1 focus:outline-none"
    />

    <div class="relative overflow-hidden" :class="horizontal ? 'sm:col-span-3' : ''">
      <!-- `sizes` uses @nuxt/image's `screenKey:size` form. Raw CSS media
           queries get collapsed by the module to the last bare value, which
           made phones download the desktop-width variant. -->
      <NuxtImg
        loading="lazy"
        class="w-full object-cover object-center transition-all duration-500"
        :class="horizontal
          ? 'h-48 sm:h-full group-hover:scale-[1.04]'
          : 'h-48 group-hover:scale-105 group-hover:brightness-105'"
        :width="horizontal ? 289 : 400"
        :height="horizontal ? 184 : 192"
        :sizes="horizontal
          ? 'sm:100vw md:289px'
          : 'sm:100vw md:50vw lg:400px'"
        densities="x1 x2"
        :src="image"
        :alt="alt"
      />
      <div
        class="absolute inset-0 pointer-events-none bg-gradient-to-t"
        :class="horizontal ? 'from-black/45 via-black/0 to-black/0' : 'from-black/55 via-black/10 to-transparent'"
      />

      <div v-if="trending || isNew || isUpdated" class="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span v-if="trending" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/95 text-white shadow-sm backdrop-blur">
          <Icon name="mdi:fire" size="12" aria-hidden="true" />
          Trending
        </span>
        <span v-else-if="isNew" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/95 text-white shadow-sm backdrop-blur">
          <Icon name="mdi:star-four-points" size="12" aria-hidden="true" />
          New
        </span>
        <span v-if="isUpdated" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-600/95 text-white shadow-sm backdrop-blur">
          <Icon name="mdi:update" size="12" aria-hidden="true" />
          Updated
        </span>
      </div>

      <span
        v-if="primaryTag"
        class="absolute bottom-3 left-3 inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-spacemono font-semibold bg-white/95 text-slate-800 shadow-sm backdrop-blur"
      >
        #{{ primaryTag }}
      </span>
    </div>

    <div class="flex flex-col gap-2.5" :class="horizontal ? 'sm:col-span-7 p-6' : 'p-5 flex-1'">
      <h2
        class="font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-2"
        :class="horizontal ? 'text-lg sm:text-xl' : 'text-lg'"
      >
        {{ title }}
      </h2>

      <p class="text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2" :class="horizontal ? '' : 'flex-1'">
        {{ description }}
      </p>

      <div v-if="restTags.length" class="relative z-10 flex flex-wrap gap-1.5">
        <NuxtLink
          v-for="tag in restTags"
          :key="tag"
          :to="`/categories/${tag}`"
          :class="tagColorClass(tag)"
          class="rounded-full px-2 py-0.5 text-[11px] font-spacemono font-medium"
        >
          #{{ tag }}
        </NuxtLink>
      </div>

      <div class="flex items-center justify-between pt-2.5 mt-auto border-t border-slate-100 dark:border-slate-800/80">
        <div class="flex items-center gap-1.5 font-spacemono text-xs text-slate-500 dark:text-slate-400">
          <Icon name="mdi:calendar-outline" size="14" aria-hidden="true" />
          <span>{{ displayDate }}</span>
        </div>
        <div class="inline-flex items-center gap-1 text-[11px] font-spacemono uppercase tracking-wider text-accent-600 dark:text-accent-400 group-hover:underline">
          Read More
          <LogoArrow />
        </div>
      </div>
    </div>
  </article>
</template>
