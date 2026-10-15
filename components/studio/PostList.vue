<script setup lang="ts">
import type { BlogPostMeta } from '~/utils/blog-post'
import { computed, onMounted, ref } from 'vue'
import { useBlogStudio } from '~/composables/useBlogStudio'

const { listPosts, reindex } = useBlogStudio()

const posts = ref<BlogPostMeta[]>([])
const loading = ref(true)
const errorMsg = ref('')
const query = ref('')
const reindexing = ref(false)
const reindexMsg = ref('')

async function refresh() {
  loading.value = true
  errorMsg.value = ''
  try {
    posts.value = await listPosts()
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load posts'
  }
  finally {
    loading.value = false
  }
}

async function onReindex() {
  reindexing.value = true
  reindexMsg.value = ''
  try {
    const res = await reindex()
    reindexMsg.value = `Index rebuilt from ${res.count} posts.`
    await refresh()
  }
  catch (e: unknown) {
    reindexMsg.value = e instanceof Error ? e.message : 'Reindex failed'
  }
  finally {
    reindexing.value = false
  }
}

const filtered = computed(() => {
  const q = query.value.trim().toLocaleLowerCase()
  if (!q)
    return posts.value
  return posts.value.filter(p =>
    p.title.toLocaleLowerCase().includes(q)
    || p.slug.includes(q)
    || p.tags.some(t => t.toLocaleLowerCase().includes(q)))
})

const draftCount = computed(() => posts.value.filter(p => !p.published).length)

function formatDate(iso: string): string {
  if (!iso)
    return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  catch {
    return iso
  }
}

onMounted(refresh)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <NuxtLink
        to="/studio/new"
        class="inline-flex items-center gap-1.5 bg-fg text-bg px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        <Icon name="mdi:plus" size="16" />
        New post
      </NuxtLink>

      <input
        v-model="query"
        type="search"
        placeholder="Filter by title, slug or tag…"
        class="flex-1 min-w-[12rem] border border-line-strong bg-panel px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/60"
      >

      <button
        type="button"
        class="text-xs text-slate-500 hover:text-fg underline hover:cursor-pointer"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="errorMsg" class="mb-4 text-sm text-red-600 dark:text-red-400">
      {{ errorMsg }}
    </p>

    <p v-if="!loading" class="mb-3 font-spacemono text-xs text-fg-muted">
      {{ posts.length }} posts · {{ draftCount }} draft{{ draftCount === 1 ? '' : 's' }}
    </p>

    <div v-if="loading" class="text-sm text-slate-500">
      Loading posts…
    </div>

    <ul v-else class="divide-y divide-line border-y border-line">
      <li v-for="post in filtered" :key="post.slug">
        <NuxtLink
          :to="`/studio/${post.slug}`"
          class="flex items-start gap-3 py-3 group"
        >
          <span
            class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
            :class="post.published ? 'bg-green-500' : 'bg-amber-500'"
            :title="post.published ? 'Published' : 'Draft'"
          />
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-fg group-hover:text-accent-500 transition-colors">
              {{ post.title }}
            </span>
            <span class="block font-spacemono text-xs text-fg-muted truncate">
              /{{ post.slug }} · {{ formatDate(post.createdAt) }}
              <template v-if="post.tags.length"> · {{ post.tags.join(', ') }}</template>
              <template v-if="post.noindex"> · noindex</template>
            </span>
          </span>
          <Icon name="mdi:chevron-right" size="18" class="mt-1 shrink-0 text-slate-400" />
        </NuxtLink>
      </li>
      <li v-if="!filtered.length" class="py-6 text-sm text-slate-500">
        No posts match.
      </li>
    </ul>

    <div class="mt-8 pt-4 border-t border-line">
      <button
        type="button"
        class="text-xs text-slate-500 hover:text-fg underline hover:cursor-pointer"
        :disabled="reindexing"
        @click="onReindex"
      >
        {{ reindexing ? 'Rebuilding…' : 'Rebuild index' }}
      </button>
      <span class="ml-2 text-xs text-fg-muted">
        Only needed if the public list disagrees with this one.
      </span>
      <p v-if="reindexMsg" class="mt-2 text-xs text-fg-muted">
        {{ reindexMsg }}
      </p>
    </div>
  </div>
</template>
