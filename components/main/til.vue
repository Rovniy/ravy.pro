<script lang="ts" setup>
import type { TilNoteMeta } from '~/utils/til'
import { tilTopic } from '~/data/til'
import { formatBlogDate } from '~/utils/helper'

// The newest TIL notes on the home page: title, excerpt, date and topics. The
// full body lives on /til and on each note's own page, which is the URL that
// gets indexed, so the home page only links to it. Until the first note is
// published the section renders nothing, and a failed fetch hides it too: a
// notes outage must not put an error box on the home page.
const { trackCta } = useAnalytics()

const { data } = await useAsyncData('til-home-notes', () =>
  $fetch<TilNoteMeta[]>('/api/til/notes').catch(() => [] as TilNoteMeta[]))

const notes = computed(() => (data.value ?? []).slice(0, 4))
</script>

<template>
  <section v-if="notes.length" class="py-14 px-6">
    <UiSectionHeader eyebrow="Today I Learned" title="Short notes" to="/til" link-label="All notes" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <NuxtLink
        v-for="(note, i) in notes"
        :key="note.path"
        v-spotlight
        v-reveal="(i % 2) * 90"
        :to="note.path"
        class="group relative flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
        @click="trackCta(note.path, 'home_til')"
      >
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1 font-spacemono text-xs text-slate-500 dark:text-slate-400">
          <time :datetime="note.createdAt">{{ formatBlogDate(note.createdAt) }}</time>
          <span v-for="id in note.topics" :key="id" class="text-accent-600 dark:text-accent-400">
            #{{ tilTopic(id)?.name ?? id }}
          </span>
        </span>
        <span class="mt-2 font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
          {{ note.title }}
        </span>
        <span class="mt-2 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
          {{ note.excerpt }}
        </span>
        <span class="mt-4 inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
          Read note
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </NuxtLink>
    </div>
  </section>
</template>
