<script setup lang="ts">
import type { TilNoteMeta } from '~/utils/til'
import { navbarData, seoData } from '~/data'
import { EVENTS } from '~/data/analytics'
import { tilTopic, tilTopicPath } from '~/data/til'
import { formatBlogDate } from '~/utils/helper'

interface NoteResponse extends TilNoteMeta {
  body: Record<string, unknown>
  related: TilNoteMeta[]
}

const route = useRoute()
const slug = String(route.params.slug ?? '')

const { data: note, error } = await useAsyncData(`til-note-${slug}`, () =>
  $fetch<NoteResponse>(`/api/til/note/${slug}`))

// Same rule as a blog post: a Firestore hiccup is a 503 Google retries, never
// a 404 that tells it an indexed note is gone.
if (error.value || !note.value) {
  const status = (error.value as { statusCode?: number } | null)?.statusCode
  throw status === 404 || !error.value
    ? createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
    : createError({ statusCode: 503, statusMessage: 'Note temporarily unavailable', fatal: true })
}

const n = note.value
const url = `${seoData.mySite}${n.path}`
const topics = n.topics.map(id => ({ id, name: tilTopic(id)?.name ?? id, url: `${seoData.mySite}${tilTopicPath(id)}` }))
const primary = n.topics[0] ? tilTopic(n.topics[0]) : undefined
const title = `${n.title} | TIL`
const updated = n.lastUpdated && n.lastUpdated.slice(0, 10) !== n.createdAt.slice(0, 10)

useHead({
  title,
  htmlAttrs: { lang: 'en' },
  link: [
    { rel: 'canonical', href: url },
    { rel: 'alternate', type: 'application/rss+xml', title: 'TIL notes', href: `${seoData.mySite}/til/rss.xml` },
  ],
  meta: [
    { name: 'description', content: n.excerpt },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: navbarData.homeTitle },
    { property: 'og:url', content: url },
    { property: 'og:title', content: n.title },
    { property: 'og:description', content: n.excerpt },
    { property: 'og:locale', content: 'en_US' },
    { property: 'article:author', content: seoData.author },
    { property: 'article:published_time', content: n.createdAt },
    { property: 'article:modified_time', content: n.lastUpdated || n.createdAt },
    ...topics.map(t => ({ property: 'article:tag', content: t.name })),
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: seoData.twitterHandle },
    { name: 'twitter:title', content: n.title },
    { name: 'twitter:description', content: n.excerpt },
  ],
})

useTilNoteSchema({ url, title: n.title, excerpt: n.excerpt, topics, createdAt: n.createdAt, lastUpdated: n.lastUpdated })

defineOgImage('Note', { title: n.title, topic: primary?.name ?? '', excerpt: n.excerpt })

onMounted(() => {
  useAnalytics().track(EVENTS.TIL_VIEW, { slug: n.slug, topics: n.topics.join(',') })
})
</script>

<template>
  <div v-if="note" class="px-6 container max-w-3xl mx-auto py-10 sm:py-14">
    <nav aria-label="Breadcrumb" class="mb-6 font-spacemono text-xs text-fg-muted">
      <ol class="flex flex-wrap items-center gap-1.5">
        <li>
          <NuxtLink to="/til" class="hover:text-accent-ink">
            TIL
          </NuxtLink>
        </li>
        <template v-if="primary">
          <li aria-hidden="true">
            /
          </li>
          <li>
            <NuxtLink :to="tilTopicPath(primary.id)" class="hover:text-accent-ink">
              {{ primary.name }}
            </NuxtLink>
          </li>
        </template>
      </ol>
    </nav>

    <article>
      <header class="mb-6">
        <p class="eyebrow mb-3">
          Today I learned
        </p>
        <h1 class="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-fg">
          {{ note.title }}
        </h1>
        <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-spacemono text-xs text-fg-muted">
          <span>
            <time :datetime="note.createdAt">{{ formatBlogDate(note.createdAt) }}</time>
            <template v-if="updated"> · updated <time :datetime="note.lastUpdated">{{ formatBlogDate(note.lastUpdated) }}</time></template>
          </span>
          <NuxtLink
            v-for="t in topics"
            :key="t.id"
            :to="tilTopicPath(t.id)"
            class="text-accent-ink hover:underline"
          >
            #{{ t.name }}
          </NuxtLink>
        </div>
      </header>

      <div class="prose prose-slate dark:prose-invert sm:prose-lg max-w-none prose-pre:max-w-full">
        <ContentRenderer :value="{ body: note.body }" />
      </div>
    </article>

    <div class="mt-10 pt-6 border-t border-line">
      <TilShare :slug="note.slug" :url="url" :title="note.title" :excerpt="note.excerpt" :topics="note.topics" />
    </div>

    <div class="mt-8">
      <TilAuthorBox />
    </div>

    <section v-if="note.related.length" class="mt-12">
      <h2 class="text-lg font-bold text-fg mb-4">
        Related notes
      </h2>
      <ul class="divide-y divide-line border-y border-line">
        <li v-for="r in note.related" :key="r.slug">
          <NuxtLink :to="r.path" class="group flex items-baseline justify-between gap-4 py-3">
            <span class="font-medium text-fg group-hover:text-accent-ink transition-colors">{{ r.title }}</span>
            <time :datetime="r.createdAt" class="shrink-0 font-spacemono text-xs text-fg-muted">{{ formatBlogDate(r.createdAt) }}</time>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <div class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <NuxtLink v-if="primary" :to="tilTopicPath(primary.id)" class="inline-flex items-center gap-1 text-accent-ink hover:underline">
        All {{ primary.name }} notes
        <Icon name="mdi:arrow-right" size="16" aria-hidden="true" />
      </NuxtLink>
      <NuxtLink v-if="primary?.category" :to="`/categories/${primary.category}`" class="inline-flex items-center gap-1 text-fg-muted hover:text-accent-ink">
        Longer posts on this
        <Icon name="mdi:arrow-right" size="16" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>
