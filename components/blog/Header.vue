<script setup lang="ts">
import { baseData } from '~/data'
import { formatBlogDate, tagColorClass } from '~/utils/helper'

interface Props {
  title: string
  image: string
  alt: string
  description: string
  /** ISO timestamp. Rendered as `<time datetime>` — do not pass a formatted string. */
  createdAt: string
  /** ISO timestamp. Shown only when it is meaningfully later than `createdAt`. */
  lastUpdated?: string
  tags: Array<string>
  readingTime?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: 'no-title',
  image: '#',
  alt: 'no-img',
  description: 'no description',
  createdAt: '',
  lastUpdated: '',
  tags: () => ([]),
  readingTime: undefined,
})

// Reporting "updated" on a same-day tidy-up is noise, and the legacy archive has
// posts whose `lastUpdated` is minutes after `createdAt`. A week is the same
// threshold BlogCard uses for its "Updated" badge, so the two agree.
const UPDATE_THRESHOLD_DAYS = 7

const showUpdated = computed(() => {
  if (!props.lastUpdated || !props.createdAt)
    return false
  const created = new Date(props.createdAt).getTime()
  const updated = new Date(props.lastUpdated).getTime()
  if (Number.isNaN(created) || Number.isNaN(updated))
    return false
  return (updated - created) / 86_400_000 >= UPDATE_THRESHOLD_DAYS
})
</script>

<template>
  <header>
    <h1 class="text-3xl md:text-4xl lg:text-5xl m-7 font-bold tracking-tight text-center text-slate-900 dark:text-white">
      {{ title || '' }}
    </h1>

    <NuxtImg
      fetchpriority="high"
      loading="eager"
      :src="image || ''"
      :alt="alt || ''"
      width="600"
      height="288"
      sizes="sm:67vw md:80vw"
      class="m-auto rounded-2xl shadow-lg h-32 md:h-72 w-4/6 md:w-4/5 content-center object-cover"
    />

    <p class="text-xs sm:text-sm my-3 max-w-xl mx-auto text-center text-slate-600 dark:text-slate-400">
      {{ description }}
    </p>

    <div class="flex w-full justify-center text-xs md:text-base my-8">
      <div class="md:flex items-center text-black dark:text-slate-300 content-center gap-8 text-xs sm:text-sm">
        <!--
          Byline. The JSON-LD has always named an author, but nothing on the page
          did — no visible name, no rel="author" — so a reader (or anything
          parsing the HTML rather than the graph) had no attribution at all.
        -->
        <div class="flex items-center gap-1 font-spacemono">
          <Icon name="mdi:account-outline" size="18" aria-hidden="true" />
          <NuxtLink to="/about" rel="author" class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
            {{ baseData.me.name }}
          </NuxtLink>
        </div>

        <!--
          `<time datetime>` rather than a bare <p>. The date was rendering as
          human text only ("Jun 4, 2025"), so the publication date existed in the
          JSON-LD and the meta tags but nowhere in the document itself.
        -->
        <div class="flex items-center gap-1 font-spacemono">
          <LogoDate />

          <time :datetime="createdAt">{{ formatBlogDate(createdAt) }}</time>
        </div>

        <div v-if="showUpdated" class="flex items-center gap-1 font-spacemono text-slate-500 dark:text-slate-400">
          <Icon name="mdi:update" size="18" aria-hidden="true" />
          <span>Updated <time :datetime="lastUpdated">{{ formatBlogDate(lastUpdated) }}</time></span>
        </div>

        <div v-if="readingTime" class="flex items-center gap-1 font-spacemono">
          <Icon name="mdi:clock-outline" size="18" aria-hidden="true" />
          <p>{{ readingTime }} min read</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap my-5">
          <NuxtLink
            v-for="tag in tags"
            :key="tag"
            :to="`/categories/${tag}`"
            :class="tagColorClass(tag)"
            class="rounded-full px-3 py-1 text-xs font-spacemono font-medium transition-opacity hover:opacity-80"
          >
            #{{ tag }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>
</template>
