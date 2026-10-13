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
          <NuxtLink to="/til" class="hover:text-accent-600 dark:hover:text-accent-400">
            Today I learned
          </NuxtLink> / {{ topic.name }}
        </template>
        <template v-else>
          Notes · {{ feed.total }}
        </template>
      </p>
      <h1 class="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-accent-600 to-emerald-600 dark:from-accent-400 dark:to-emerald-400 bg-clip-text text-transparent">
        {{ topic ? `${topic.name} notes` : tilPage.title }}
      </h1>
      <p class="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
        {{ topic ? topic.description : tilPage.intro }}
      </p>
      <div class="mt-6">
        <TilTopicChips :counts="feed.counts" :active="topic?.id" />
      </div>
    </header>

    <div v-if="feed.notes.length" class="flex flex-col gap-5">
      <TilNoteCard v-for="note in feed.notes" :key="note.slug" :note="note" />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-6 py-12 text-center">
      <p class="text-slate-700 dark:text-slate-200">
        No notes here yet.
      </p>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Subscribe to the RSS feed to get the first one.
      </p>
    </div>

    <section v-if="feed.archive.length" class="mt-12">
      <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
        Earlier notes
      </h2>
      <ul class="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
        <li v-for="note in feed.archive" :key="note.slug">
          <NuxtLink :to="note.path" class="group flex items-baseline justify-between gap-4 py-3">
            <span class="font-medium text-slate-800 dark:text-slate-200 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{{ note.title }}</span>
            <time :datetime="note.createdAt" class="shrink-0 font-spacemono text-xs text-slate-500 dark:text-slate-400">{{ formatBlogDate(note.createdAt) }}</time>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div v-if="topic?.category" class="mt-8">
      <NuxtLink :to="`/categories/${topic.category}`" class="inline-flex items-center gap-1 text-sm text-accent-600 dark:text-accent-400 hover:underline">
        Longer blog posts on this
        <Icon name="mdi:arrow-right" size="16" aria-hidden="true" />
      </NuxtLink>
    </div>

    <div class="mt-12">
      <TilAuthorBox />
    </div>
  </div>
</template>
