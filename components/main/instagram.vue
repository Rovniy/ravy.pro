<script lang="ts" setup>
import { socialNetworks } from '~/data'

const profileUrl = socialNetworks.find(s => s.name === 'Instagram')?.href || 'https://www.instagram.com/ravygo'

const { data } = await useAsyncData('instagram-recent', () =>
  queryCollection('content').where('path', 'LIKE', '/instagram/%').order('postedAt', 'DESC').limit(8).all())

const photos = computed(() => {
  return (data.value || [])
    .filter(item => item.published)
    .map(item => ({
      id: item.path,
      image: item.image || '/not-found.png',
      alt: item.alt || item.caption || 'Instagram photo',
      caption: item.caption || '',
    }))
})
</script>

<template>
  <section v-if="photos.length" class="py-14 px-6">
    <div class="flex items-center justify-between gap-3 mb-8 flex-wrap">
      <div class="flex items-center gap-3">
        <Icon name="fa:instagram" size="1.4em" aria-hidden="true" class="text-pink-500" />
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          Instagram
        </h2>
      </div>
      <a
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-sm font-semibold text-pink-600 dark:text-pink-400 hover:underline"
      >
        Follow @ravygo
        <Icon name="mdi:arrow-right" size="14" aria-hidden="true" />
      </a>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-0">
      <InstagramCard
        v-for="photo in photos"
        :key="photo.id"
        :image="photo.image"
        :alt="photo.alt"
        :caption="photo.caption"
        :profile-url="profileUrl"
      />
    </div>
  </section>
</template>
