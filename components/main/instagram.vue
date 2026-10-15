<script lang="ts" setup>
import { socialNetworks } from '~/data'

const profileUrl = socialNetworks.find(s => s.name === 'Instagram')?.href || 'https://www.instagram.com/ravygo'

// `published` belongs in the WHERE, not in a post-fetch filter: applied after
// `.limit(8)` an unpublished photo would still consume one of the eight slots and
// the 12-cell bento would stop closing.
const { data } = await useAsyncData('instagram-recent', () =>
  queryCollection('content')
    .where('path', 'LIKE', '/instagram/%')
    .where('published', '=', true)
    .select('path', 'image', 'alt', 'caption', 'postedAt')
    .order('postedAt', 'DESC')
    .limit(8)
    .all())

const photos = computed(() => {
  return (data.value || [])
    .map(item => ({
      id: item.path,
      image: item.image || '/not-found.png',
      alt: item.alt || item.caption || 'Instagram photo',
      caption: item.caption || '',
    }))
})
</script>

<template>
  <section v-if="photos.length" class="py-14">
    <UiSectionHeader eyebrow="Photos" title="Instagram">
      <template #action>
        <a
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group inline-flex items-center gap-1 font-spacemono text-micro uppercase tracking-[0.12em] text-fg-muted hover:text-accent-ink transition-colors"
        >
          Follow @ravygo
          <Icon name="mdi:arrow-right" size="14" aria-hidden="true" class="transition-transform duration-200 group-hover:translate-x-0.5" />
        </a>
      </template>
    </UiSectionHeader>

    <!-- Editorial bento mosaic: the newest shot leads at 2×2, the rest flow
         around it, and a "follow" tile completes the rectangle — with 8
         photos the grid closes perfectly at every breakpoint (12 cells). -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 [grid-auto-flow:dense]">
      <InstagramCard
        v-for="(photo, i) in photos"
        :key="photo.id"
        :image="photo.image"
        :alt="photo.alt"
        :caption="photo.caption"
        :profile-url="profileUrl"
        :featured="i === 0"
        :index="i"
      />

      <a
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative aspect-square overflow-hidden border border-line bg-panel flex flex-col items-center justify-center gap-2.5 text-center p-4 transition-all duration-300 hover:border-accent"
      >

        <span class="relative grid place-items-center w-11 h-11 bg-accent text-accent-fg">
          <Icon name="mdi:instagram" class="w-6 h-6" aria-hidden="true" />
        </span>
        <span class="relative font-semibold text-fg">
          @ravygo
        </span>
        <span class="relative inline-flex items-center gap-1 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
          Follow
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </a>
    </div>
  </section>
</template>
