<script lang="ts" setup>
import { daysSince, formatBlogDate } from '~/utils/helper'

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
  <!-- Cut frame: the whole card is one link (the overlay), the tags are their
       own links above it. Hover or keyboard focus anywhere turns the border
       accent (.frame in tailwind.css). -->
  <article class="frame cut group relative" :class="horizontal ? '' : 'h-full'">
    <div
      class="frame-inner cut relative overflow-hidden text-fg-muted"
      :class="horizontal ? 'grid grid-cols-1 sm:grid-cols-10' : 'flex flex-col'"
    >
      <NuxtLink
        :to="path"
        :aria-label="title"
        class="absolute inset-0 z-1 focus:outline-none"
      />

      <div class="relative overflow-hidden bg-panel-raised" :class="horizontal ? 'sm:col-span-3' : ''">
        <!-- `sizes` uses @nuxt/image's `screenKey:size` form. Raw CSS media
             queries get collapsed by the module to the last bare value, which
             made phones download the desktop-width variant. -->
        <NuxtImg
          loading="lazy"
          class="w-full object-cover object-center"
          :class="horizontal ? 'h-48 sm:h-full' : 'h-48'"
          :width="horizontal ? 289 : 400"
          :height="horizontal ? 184 : 192"
          :sizes="horizontal
            ? 'sm:100vw md:289px'
            : 'sm:100vw md:50vw lg:400px'"
          densities="x1 x2"
          :src="image"
          :alt="alt"
        />
        <div class="scrim-b absolute inset-0 pointer-events-none" />

        <div v-if="trending || isNew || isUpdated" class="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <UiTag v-if="trending" tone="accent">
            <Icon name="mdi:fire" size="12" aria-hidden="true" />
            Trending
          </UiTag>
          <UiTag v-else-if="isNew" tone="accent">
            New
          </UiTag>
          <UiTag v-if="isUpdated" tone="accent">
            Updated
          </UiTag>
        </div>

        <span
          v-if="primaryTag"
          class="absolute bottom-3 left-3 font-spacemono text-micro uppercase tracking-[0.1em] text-white"
        >
          #{{ primaryTag }}
        </span>
      </div>

      <div class="flex flex-col gap-2.5" :class="horizontal ? 'sm:col-span-7 p-6' : 'p-5 flex-1'">
        <h2
          class="font-semibold leading-snug text-fg group-hover:text-accent-ink transition-colors line-clamp-2"
          :class="horizontal ? 'text-lg sm:text-xl' : 'text-lg'"
        >
          {{ title }}
        </h2>

        <p class="text-sm leading-relaxed text-fg-muted line-clamp-2" :class="horizontal ? '' : 'flex-1'">
          {{ description }}
        </p>

        <div v-if="restTags.length" class="relative z-10 flex flex-wrap gap-1.5">
          <UiTag
            v-for="tag in restTags"
            :key="tag"
            :to="`/categories/${tag}`"
          >
            #{{ tag }}
          </UiTag>
        </div>

        <div class="flex items-center justify-between pt-2.5 mt-auto border-t border-line">
          <time :datetime="createdAt" class="font-spacemono text-xs tabular-nums text-fg-subtle">{{ displayDate }}</time>
          <span class="inline-flex items-center gap-1 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
            Read
            <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
