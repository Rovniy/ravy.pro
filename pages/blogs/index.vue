<script lang="ts" setup>
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { blogsPage } from '~/data'

const route = useRoute()
const router = useRouter()

const { data } = await useAsyncData('home', () =>
  queryCollection('content').where('path', 'LIKE', '/blogs/%').order('createdAt', 'DESC').all())

const elementPerPage = 5
const searchTest = ref('')

const activeTag = computed({
  get: () => (typeof route.query.tag === 'string' ? route.query.tag : ''),
  set: (val: string) => router.push({ query: { ...route.query, tag: val || undefined, page: undefined } }),
})

function toggleTag(tag: string) {
  activeTag.value = activeTag.value === tag ? '' : tag
}

const pageNumber = computed({
  get: () => Math.max(1, Number(route.query.page) || 1),
  set: (val: number) => router.push({ query: { ...route.query, page: val > 1 ? val : undefined } }),
})

watch(searchTest, () => {
  pageNumber.value = 1
})

const formattedData = computed(() => {
  return data.value?.map((articles) => {
    return {
      path: articles.path,
      title: articles?.title || 'no-title available',
      description: articles?.description || 'no-description available',
      image: articles?.image || '/not-found.png',
      alt: articles?.alt || articles?.description || 'no alter data available',
      ogImage: articles?.ogImage || articles?.image || '/not-found.png',
      createdAt: articles?.createdAt || '',
      lastUpdated: articles?.lastUpdated || '',
      tags: articles?.tags || [],
      published: articles?.published || false,
      trending: articles?.trending || false,
    }
  }) || []
})

// All tags across posts, most-used first, with a count for each chip.
const allTags = computed(() => {
  const counts = new Map<string, number>()
  for (const post of formattedData.value) {
    for (const tag of post.tags)
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }))
})

const searchData = computed(() => {
  const q = searchTest.value.trim().toLocaleLowerCase()
  const tag = activeTag.value
  return formattedData.value.filter((post) => {
    const matchesQuery = !q
      || post.title.toLocaleLowerCase().includes(q)
      || post.description.toLocaleLowerCase().includes(q)
      || post.tags.some(t => t.toLocaleLowerCase().includes(q))
    const matchesTag = !tag || post.tags.includes(tag)
    return matchesQuery && matchesTag
  })
})

const paginatedData = computed(() => {
  const start = (pageNumber.value - 1) * elementPerPage
  return searchData.value.slice(start, start + elementPerPage)
})

const totalPage = computed(() => Math.ceil(searchData.value.length / elementPerPage))

function onPreviousPageClick() {
  if (pageNumber.value > 1)
    pageNumber.value -= 1
}

function onNextPageClick() {
  if (pageNumber.value < totalPage.value)
    pageNumber.value += 1
}

useHead({
  title: blogsPage.meta.title,
  meta: [
    {
      name: 'description',
      content: blogsPage.meta.description,
    },
  ],
})

useBlogIndexSchema({
  description: blogsPage.meta.description,
})

defineOgImage('Blog', {
  headline: blogsPage.og.headline,
  title: blogsPage.og.title,
  description: blogsPage.og.description,
  link: blogsPage.og.link,
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-slate-600">
    <ArchiveHero />

    <div class="px-6 mt-2 mb-8">
      <div class="relative">
        <Icon name="mdi:magnify" size="18" aria-hidden="true" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchTest"
          placeholder="Search by title, description, or tag…"
          aria-label="Search posts by title, description, or tag"
          type="text"
          class="block w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 dark:placeholder-slate-500 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition-all"
        >
      </div>

      <div v-if="allTags.length" class="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          :aria-pressed="!activeTag"
          class="rounded-full px-3 py-1 text-sm border transition-colors hover:cursor-pointer"
          :class="!activeTag
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-500'"
          @click="activeTag = ''"
        >
          All
        </button>
        <button
          v-for="t in allTags"
          :key="t.tag"
          type="button"
          :aria-pressed="activeTag === t.tag"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-colors hover:cursor-pointer"
          :class="activeTag === t.tag
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-500'"
          @click="toggleTag(t.tag)"
        >
          {{ t.tag }}
          <span class="tabular-nums opacity-60">{{ t.count }}</span>
        </button>
      </div>
    </div>

    <div v-auto-animate class="flex flex-col gap-4 px-6 mb-8">
      <template v-for="post in paginatedData" :key="post.title">
        <ArchiveCard
          :path="post.path"
          :title="post.title"
          :created-at="post.createdAt"
          :last-updated="post.lastUpdated"
          :description="post.description"
          :image="post.image"
          :alt="post.alt"
          :og-image="post.ogImage"
          :tags="post.tags"
          :published="post.published"
          :trending="post.trending"
        />
      </template>

      <ArchiveCard
        v-if="paginatedData.length <= 0"
        title="No Post Found"
        image="/not-found.png"
      />
    </div>

    <div class="flex justify-center items-center gap-4 pb-12">
      <button
        :disabled="pageNumber <= 1"
        type="button"
        aria-label="Previous page"
        class="w-9 h-9 flex items-center justify-center rounded-full border dark:border-slate-700 disabled:opacity-30 hover:border-sky-400 hover:text-sky-500 transition-all"
        @click="onPreviousPageClick"
      >
        <Icon name="mdi:chevron-left" size="20" aria-hidden="true" />
      </button>
      <span class="text-sm text-slate-500 dark:text-slate-400 tabular-nums" aria-live="polite">
        {{ pageNumber }} / {{ totalPage }}
      </span>
      <button
        :disabled="pageNumber >= totalPage"
        type="button"
        aria-label="Next page"
        class="w-9 h-9 flex items-center justify-center rounded-full border dark:border-slate-700 disabled:opacity-30 hover:border-sky-400 hover:text-sky-500 transition-all"
        @click="onNextPageClick"
      >
        <Icon name="mdi:chevron-right" size="20" aria-hidden="true" />
      </button>
    </div>
  </main>
</template>
