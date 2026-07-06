<script lang="ts" setup>
import { socialNetworks } from '~/data'

const profileUrl = socialNetworks.find(s => s.name === 'Instagram')?.href || 'https://www.instagram.com/ravygo'

const { data } = await useAsyncData('instagram-recent', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/instagram/%')
    .select('path', 'image', 'alt', 'caption', 'published', 'postedAt')
    .order('postedAt', 'DESC')
    .limit(8)
    .all())

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
    <UiSectionHeader eyebrow="Photos" title="Instagram">
      <template #action>
        <a
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center gap-1 mb-0.5 font-spacemono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
        >
          Follow @ravygo
          <Icon name="mdi:arrow-right" size="14" aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </template>
    </UiSectionHeader>

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
