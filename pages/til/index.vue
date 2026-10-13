<script setup lang="ts">
import type { TilFeedResponse } from '~/components/til/Feed.vue'
import { seoData } from '~/data'
import { tilPage } from '~/data/til'

const { data: feed, error } = await useAsyncData('til-feed', () =>
  $fetch<TilFeedResponse>('/api/til/feed', { query: { limit: 20 } }))

if (error.value || !feed.value)
  throw createError({ statusCode: 503, statusMessage: 'Notes temporarily unavailable', fatal: true })

const url = `${seoData.mySite}/til`
const title = `${tilPage.title}: short engineering notes`

useHead({
  title,
  link: [{ rel: 'alternate', type: 'application/rss+xml', title: 'TIL notes', href: `${seoData.mySite}/til/rss.xml` }],
  meta: [{ name: 'description', content: tilPage.description }],
})

useTilCollectionSchema({
  url,
  name: title,
  description: tilPage.description,
  notes: [...feed.value.notes, ...feed.value.archive],
})

defineOgImage('Note', { title: 'Short engineering notes: one problem, one fix', topic: 'Today I Learned', excerpt: tilPage.description })
</script>

<template>
  <TilFeed v-if="feed" :feed="feed" />
</template>
