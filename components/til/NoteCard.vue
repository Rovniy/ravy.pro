<script setup lang="ts">
import type { TilNoteMeta } from '~/utils/til'
import { tilTopic, tilTopicPath } from '~/data/til'
import { formatBlogDate } from '~/utils/helper'

// One note in a feed (/til, a topic hub). Notes are a few lines, so the feed
// shows them whole; the title links to the note's own page, which is the URL
// that gets indexed and shared.

defineProps<{
  note: TilNoteMeta & { body: Record<string, unknown> }
  /** Heading level: h2 on /til, h2 on a hub too, kept as a prop for reuse. */
  as?: 'h2' | 'h3'
}>()
</script>

<template>
  <article class="til-note group relative border border-line bg-white/60 p-5 sm:p-6 transition-colors hover:border-accent">
    <header class="mb-3">
      <div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-spacemono text-xs text-fg-muted">
        <time :datetime="note.createdAt">{{ formatBlogDate(note.createdAt) }}</time>
        <template v-for="id in note.topics" :key="id">
          <NuxtLink :to="tilTopicPath(id)" class="relative z-10 text-accent-ink hover:underline">
            #{{ tilTopic(id)?.name ?? id }}
          </NuxtLink>
        </template>
      </div>
      <component :is="as ?? 'h2'" class="text-lg sm:text-xl font-bold leading-snug text-fg">
        <NuxtLink :to="note.path" class="hover:text-accent-ink transition-colors">
          {{ note.title }}
        </NuxtLink>
      </component>
    </header>
    <div class="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none prose-pre:max-w-full prose-p:my-2 prose-pre:my-3">
      <ContentRenderer :value="{ body: note.body }" />
    </div>
    <footer class="mt-3 flex justify-end">
      <NuxtLink :to="note.path" class="inline-flex items-center gap-1 font-spacemono text-xs text-fg-muted hover:text-accent-ink" :aria-label="`Permalink: ${note.title}`">
        <Icon name="mdi:link-variant" size="14" aria-hidden="true" />
        permalink
      </NuxtLink>
    </footer>
  </article>
</template>
