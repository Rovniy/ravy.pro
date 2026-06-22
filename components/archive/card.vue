<script lang="ts" setup>
import { daysSince, formatBlogDate, tagColorClass } from '~/utils/helper'

interface Props {
  path?: string
  title?: string
  createdAt?: string
  lastUpdated?: string
  description?: string
  image?: string
  alt?: string
  ogImage?: string
  tags?: Array<string>
  published?: boolean
  trending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  path: '/',
  title: 'no-title',
  createdAt: '',
  lastUpdated: '',
  description: 'no-description',
  image: '/not-found.png',
  alt: 'no-alt',
  ogImage: '/not-found.png',
  tags: () => [],
  published: false,
  trending: false,
})

const displayDate = computed(() => formatBlogDate(props.createdAt))
const isNew = computed(() => daysSince(props.createdAt) <= 30)
const isUpdated = computed(() => {
  if (!props.lastUpdated || !props.createdAt)
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
  <article class="group relative grid grid-cols-1 sm:grid-cols-10 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-300 dark:hover:border-sky-700/60 focus-within:ring-2 focus-within:ring-sky-400">
    <NuxtLink
      :to="path"
      :aria-label="title"
      class="absolute inset-0 z-1 focus:outline-none"
    />

    <div class="relative sm:col-span-3 overflow-hidden">
      <NuxtImg
        loading="lazy"
        class="h-48 sm:h-full w-full object-cover object-center group-hover:scale-[1.04] transition-all duration-500"
        width="289"
        height="184"
        sizes="(max-width: 640px) 100vw, 289px"
        densities="x1 x2"
        :src="image"
        :alt="alt"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/0 pointer-events-none" />

      <div v-if="trending || isNew || isUpdated" class="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span v-if="trending" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/95 text-white shadow-sm backdrop-blur">
          <Icon name="mdi:fire" size="12" aria-hidden="true" />
          Trending
        </span>
        <span v-else-if="isNew" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/95 text-white shadow-sm backdrop-blur">
          <Icon name="mdi:star-four-points" size="12" aria-hidden="true" />
          New
        </span>
        <span v-if="isUpdated" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/95 text-white shadow-sm backdrop-blur">
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

    <div class="sm:col-span-7 p-6 flex flex-col gap-2.5">
      <h2 class="text-lg sm:text-xl font-bold leading-snug tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2">
        {{ title }}
      </h2>

      <p class="text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
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
        <div class="flex items-center gap-1.5 font-spacemono text-[11px] text-slate-400 dark:text-slate-500">
          <Icon name="mdi:calendar-outline" size="14" aria-hidden="true" />
          <span>{{ displayDate }}</span>
        </div>
        <div class="inline-flex items-center gap-1 text-[11px] font-spacemono uppercase tracking-wider text-sky-600 dark:text-sky-400 group-hover:underline">
          Read More
          <LogoArrow />
        </div>
      </div>
    </div>
  </article>
</template>
