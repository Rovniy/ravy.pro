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
  <section v-if="notes.length" class="py-14">
    <UiSectionHeader eyebrow="Today I Learned" title="Short notes" to="/til" link-label="All notes" />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiCard
        v-for="note in notes"
        :key="note.path"
        :to="note.path"
        cut="sm"
        padding="sm"
        @click="trackCta(note.path, 'home_til')"
      >
        <span class="flex flex-wrap items-center gap-x-3 gap-y-1 font-spacemono text-xs text-fg-subtle">
          <time :datetime="note.createdAt" class="tabular-nums">{{ formatBlogDate(note.createdAt) }}</time>
          <span v-for="id in note.topics" :key="id" class="text-accent-ink">
            #{{ tilTopic(id)?.name ?? id }}
          </span>
        </span>
        <span class="mt-2 text-lg font-semibold leading-snug text-fg">
          {{ note.title }}
        </span>
        <span class="mt-2 grow text-sm leading-relaxed text-fg-muted line-clamp-3">
          {{ note.excerpt }}
        </span>
        <span class="mt-4 inline-flex items-center gap-1 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
          Read note
          <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </UiCard>
    </div>
  </section>
</template>
