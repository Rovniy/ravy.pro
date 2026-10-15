<script setup lang="ts">
import type { TilTopic } from '~/data/til'
import type { TilNoteMeta } from '~/utils/til'
import { tilPage } from '~/data/til'
import { formatBlogDate } from '~/utils/helper'

// /til and /til/topic/<id> are the same page with a different scope: the
// newest notes in full, the rest as a plain list, the topic hubs as links.

export interface TilFeedResponse {
  notes: Array<TilNoteMeta & { body: Record<string, unknown> }>
  archive: TilNoteMeta[]
  total: number
  counts: Record<string, number>
}

defineProps<{
  feed: TilFeedResponse
  topic?: TilTopic
}>()
</script>

<template>
  <div class="px-6 container max-w-3xl mx-auto py-10 sm:py-14">
    <header class="mb-8">
      <p class="eyebrow mb-3">
        <template v-if="topic">
          <NuxtLink to="/til" class="hover:text-accent-ink">
            Today I learned
          </NuxtLink> / {{ topic.name }}
        </template>
        <template v-else>
          Notes · {{ feed.total }}
        </template>
      </p>
      <h1 class="font-display font-extrabold uppercase text-5xl sm:text-6xl leading-none text-fg">
        {{ topic ? `${topic.name} notes` : tilPage.title }}
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
        {{ topic ? topic.description : tilPage.intro }}
      </p>
      <div class="mt-6">
        <TilTopicChips :counts="feed.counts" :active="topic?.id" />
      </div>
    </header>

    <div v-if="feed.notes.length" class="flex flex-col gap-5">
      <TilNoteCard v-for="note in feed.notes" :key="note.slug" :note="note" />
    </div>
    <div v-else class="border border-dashed border-line-strong px-6 py-12 text-center">
      <p class="text-fg">
        No notes here yet.
      </p>
      <p class="mt-1 text-sm text-fg-muted">
        Subscribe to the RSS feed to get the first one.
      </p>
    </div>

    <section v-if="feed.archive.length" class="mt-12">
      <h2 class="text-lg font-bold text-fg mb-4">
        Earlier notes
      </h2>
      <ul class="divide-y divide-line border-y border-line">
        <li v-for="note in feed.archive" :key="note.slug">
          <NuxtLink :to="note.path" class="group flex items-baseline justify-between gap-4 py-3">
            <span class="font-medium text-fg group-hover:text-accent-ink transition-colors">{{ note.title }}</span>
            <time :datetime="note.createdAt" class="shrink-0 font-spacemono text-xs text-fg-muted">{{ formatBlogDate(note.createdAt) }}</time>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div v-if="topic?.category" class="mt-8">
      <NuxtLink :to="`/categories/${topic.category}`" class="inline-flex items-center gap-1 text-sm text-accent-ink hover:underline">
        Longer blog posts on this
        <Icon name="mdi:arrow-right" size="16" aria-hidden="true" />
      </NuxtLink>
    </div>

    <div class="mt-12">
      <TilAuthorBox />
    </div>
  </div>
</template>
