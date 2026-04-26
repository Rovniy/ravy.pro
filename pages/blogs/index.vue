<script lang="ts" setup>
import { blogsPage } from '~/data'

const route = useRoute()
const router = useRouter()

const { data } = await useAsyncData('home', () =>
  queryCollection('content').where('path', 'LIKE', '/blogs/%').order('createdAt', 'DESC').all(),
)

const elementPerPage = 5
const searchTest = ref('')

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
      createdAt: new Date(articles?.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) || 'not-date-available',
      tags: articles?.tags || [],
      published: articles?.published || false,
    }
  }) || []
})

const searchData = computed(() => {
  return formattedData.value.filter((data) => {
    return data.title.toLocaleLowerCase().includes(searchTest.value.toLocaleLowerCase())
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

defineOgImage('Blog', {
  headline: blogsPage.og.headline,
  title: blogsPage.og.title,
  description: blogsPage.og.description,
  link: blogsPage.og.link,
})
</script>

<template>
  <main class="container max-w-5xl mx-auto text-zinc-600">
    <ArchiveHero />

    <div class="px-6 mt-2 mb-8">
      <div class="relative">
        <Icon name="mdi:magnify" size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          v-model="searchTest"
          placeholder="Search posts…"
          type="text"
          class="block w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 dark:placeholder-zinc-500 text-zinc-700 dark:text-zinc-300 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 transition-all"
        >
      </div>
    </div>

    <div v-auto-animate class="flex flex-col gap-4 px-6 mb-8">
      <template v-for="post in paginatedData" :key="post.title">
        <ArchiveCard
          :path="post.path"
          :title="post.title"
          :created-at="post.createdAt"
          :description="post.description"
          :image="post.image"
          :alt="post.alt"
          :og-image="post.ogImage"
          :tags="post.tags"
          :published="post.published"
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
        class="w-9 h-9 flex items-center justify-center rounded-full border dark:border-zinc-700 disabled:opacity-30 hover:border-sky-400 hover:text-sky-500 transition-all"
        @click="onPreviousPageClick"
      >
        <Icon name="mdi:chevron-left" size="20" />
      </button>
      <span class="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
        {{ pageNumber }} / {{ totalPage }}
      </span>
      <button
        :disabled="pageNumber >= totalPage"
        class="w-9 h-9 flex items-center justify-center rounded-full border dark:border-zinc-700 disabled:opacity-30 hover:border-sky-400 hover:text-sky-500 transition-all"
        @click="onNextPageClick"
      >
        <Icon name="mdi:chevron-right" size="20" />
      </button>
    </div>
  </main>
</template>
