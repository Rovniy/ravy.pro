<script lang="ts" setup>
import type { BlogPostMeta } from '~/utils/blog-post'
import { vAutoAnimate } from '@formkit/auto-animate/vue'
import { blogsPage } from '~/data'
import { EVENTS } from '~/data/analytics'
import { toCardData } from '~/utils/blog-post'

const route = useRoute()
const router = useRouter()

const { data } = await useAsyncData('blog-post-list', () =>
  $fetch<BlogPostMeta[]>('/api/blog/posts'))

const elementPerPage = 5
const searchTest = ref('')

const activeTag = computed({
  get: () => (typeof route.query.tag === 'string' ? route.query.tag : ''),
  set: (val: string) => router.push({ query: { ...route.query, tag: val || undefined, page: undefined } }),
})

// "Popular" used to be a Trending Posts block on the home page, where it
// duplicated Recent Posts. It belongs here: this is where someone is already
// choosing what to read. Backed by the manual `trending` frontmatter flag.
const onlyPopular = computed({
  get: () => route.query.popular === '1',
  set: (val: boolean) => router.push({ query: { ...route.query, popular: val ? '1' : undefined, page: undefined } }),
})

const { track } = useAnalytics()

function toggleTag(tag: string) {
  const next = activeTag.value === tag ? '' : tag
  activeTag.value = next
  if (next)
    track(EVENTS.BLOG_FILTER, { tag: next })
}

function togglePopular() {
  const next = !onlyPopular.value
  onlyPopular.value = next
  if (next)
    track(EVENTS.BLOG_FILTER, { tag: 'popular' })
}

const pageNumber = computed({
  get: () => Math.max(1, Number(route.query.page) || 1),
  set: (val: number) => router.push({ query: { ...route.query, page: val > 1 ? val : undefined } }),
})

watch(searchTest, () => {
  pageNumber.value = 1
})

// Debounced search event — only when there's a meaningful query.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchTest, (value) => {
  if (searchTimer)
    clearTimeout(searchTimer)
  const q = value.trim()
  if (q.length < 2)
    return
  searchTimer = setTimeout(() => {
    track(EVENTS.BLOG_SEARCH, { query_length: q.length })
  }, 800)
})

const formattedData = computed(() => (data.value ?? []).map(toCardData))

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
    // `/api/blog/posts` already returns published posts only. The `published`
    // test stays as a second lock on the one filter that would surface a draft
    // if that ever regressed.
    const matchesPopular = !onlyPopular.value || (post.trending && post.published)
    return matchesQuery && matchesTag && matchesPopular
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
  title: blogsPage.meta.title,
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
  <div class="container max-w-5xl mx-auto text-slate-600 dark:text-slate-300">
    <ArchiveHero />

    <div class="px-6 mt-2 mb-8">
      <div class="relative">
        <Icon name="mdi:magnify" size="18" aria-hidden="true" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="searchTest"
          placeholder="Search by title, description, or tag…"
          aria-label="Search posts by title, description, or tag"
          type="text"
          class="block w-full pl-9 pr-11 py-2.5 bg-white/80 dark:bg-slate-900/70 backdrop-blur dark:placeholder-slate-500 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-500/60 focus:border-accent-400 focus:shadow-lg focus:shadow-accent-500/10 transition-all"
        >
        <button
          v-if="searchTest"
          type="button"
          aria-label="Clear search"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-full text-slate-400 hover:text-accent-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hover:cursor-pointer"
          @click="searchTest = ''"
        >
          <Icon name="mdi:close" size="16" aria-hidden="true" />
        </button>
      </div>

      <p
        v-if="searchTest.trim() || activeTag || onlyPopular"
        class="mt-2.5 font-spacemono text-xs text-slate-500 dark:text-slate-400"
        aria-live="polite"
      >
        {{ searchData.length }} {{ searchData.length === 1 ? 'post' : 'posts' }} found
      </p>

      <div v-if="allTags.length" class="mt-3 flex flex-wrap gap-2">
        <!-- "All" means all, so it clears the popular filter too. -->
        <button
          type="button"
          :aria-pressed="!activeTag && !onlyPopular"
          class="rounded-full px-3 py-1 text-sm border transition-all hover:cursor-pointer"
          :class="!activeTag && !onlyPopular
            ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950 shadow-md shadow-accent-500/25'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-500 hover:-translate-y-px'"
          @click="router.push({ query: { ...route.query, tag: undefined, popular: undefined, page: undefined } })"
        >
          All
        </button>
        <button
          type="button"
          :aria-pressed="onlyPopular"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-all hover:cursor-pointer"
          :class="onlyPopular
            ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950 shadow-md shadow-accent-500/25'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-500 hover:-translate-y-px'"
          @click="togglePopular"
        >
          <Icon name="mdi:fire" size="14" aria-hidden="true" />
          Popular
        </button>
        <button
          v-for="t in allTags"
          :key="t.tag"
          type="button"
          :aria-pressed="activeTag === t.tag"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-all hover:cursor-pointer"
          :class="activeTag === t.tag
            ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950 shadow-md shadow-accent-500/25'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-500 hover:-translate-y-px'"
          @click="toggleTag(t.tag)"
        >
          {{ t.tag }}
          <span class="tabular-nums opacity-60">{{ t.count }}</span>
        </button>
      </div>
    </div>

    <div v-auto-animate class="flex flex-col gap-4 px-6 mb-8">
      <template v-for="post in paginatedData" :key="post.title">
        <BlogCard
          horizontal
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

      <BlogCard
        v-if="paginatedData.length <= 0"
        horizontal
        title="No Post Found"
        image="/not-found.png"
      />
    </div>

    <div class="flex justify-center items-center gap-4 pb-12">
      <button
        :disabled="pageNumber <= 1"
        type="button"
        aria-label="Previous page"
        class="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:cursor-pointer enabled:hover:border-accent-400 enabled:hover:text-accent-500 enabled:hover:shadow-md enabled:hover:shadow-accent-500/10 transition-all"
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
        class="w-11 h-11 flex items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed enabled:hover:cursor-pointer enabled:hover:border-accent-400 enabled:hover:text-accent-500 enabled:hover:shadow-md enabled:hover:shadow-accent-500/10 transition-all"
        @click="onNextPageClick"
      >
        <Icon name="mdi:chevron-right" size="20" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
