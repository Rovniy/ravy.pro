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

    <!-- Editorial bento mosaic: the newest shot leads at 2×2, the rest flow
         around it, and a glass "follow" tile completes the rectangle — with 8
         photos the grid closes perfectly at every breakpoint (12 cells). -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 [grid-auto-flow:dense]">
      <InstagramCard
        v-for="(photo, i) in photos"
        :key="photo.id"
        v-reveal="(i % 4) * 70"
        :image="photo.image"
        :alt="photo.alt"
        :caption="photo.caption"
        :profile-url="profileUrl"
        :featured="i === 0"
        :index="i"
      />

      <a
        v-reveal="(photos.length % 4) * 70"
        :href="profileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-2.5 text-center p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
      >
        <span
          class="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-gradient-to-br from-fuchsia-500/15 via-rose-400/10 to-amber-400/15 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"
          aria-hidden="true"
        />
        <span
          class="absolute -bottom-14 -left-14 w-36 h-36 rounded-full bg-gradient-to-tr from-accent-500/15 to-emerald-400/10 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500"
          aria-hidden="true"
        />

        <span class="relative grid place-items-center w-11 h-11 rounded-2xl text-white bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 shadow-lg shadow-rose-500/25 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
          <Icon name="mdi:instagram" class="w-6 h-6" aria-hidden="true" />
        </span>
        <span class="relative font-semibold text-slate-900 dark:text-slate-100">
          @ravygo
        </span>
        <span class="relative inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
          Follow
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </a>
    </div>
  </section>
</template>
