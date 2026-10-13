<script setup lang="ts">
import type { TilFeedResponse } from '~/components/til/Feed.vue'
import { seoData } from '~/data'
import { tilTopic, tilTopicPath } from '~/data/til'

const route = useRoute()
const topic = tilTopic(String(route.params.topic ?? ''))
if (!topic)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const { data: feed, error } = await useAsyncData(`til-feed-${topic.id}`, () =>
  $fetch<TilFeedResponse>('/api/til/feed', { query: { topic: topic.id, limit: 30 } }))

if (error.value || !feed.value)
  throw createError({ statusCode: 503, statusMessage: 'Notes temporarily unavailable', fatal: true })

const url = `${seoData.mySite}${tilTopicPath(topic.id)}`
const title = `${topic.name} notes: Today I Learned`

useHead({
  title,
  link: [{ rel: 'alternate', type: 'application/rss+xml', title: 'TIL notes', href: `${seoData.mySite}/til/rss.xml` }],
  // An empty hub is a thin page; it stays reachable but out of the index
  // until it has a note in it.
  meta: [
    { name: 'description', content: topic.description },
    { name: 'robots', content: feed.value.total ? 'index, follow' : 'noindex, follow' },
  ],
})

useTilCollectionSchema({
  url,
  name: title,
  description: topic.description,
  topic,
  notes: [...feed.value.notes, ...feed.value.archive],
})

defineOgImage('Note', { title: `${topic.name}: short notes with the fix`, topic: 'Today I Learned', excerpt: topic.description })
</script>

<template>
  <TilFeed v-if="feed" :feed="feed" :topic="topic" />
</template>
