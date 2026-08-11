<script setup lang="ts">
import type { BlogPostMeta } from '~/utils/blog-post'
import { computed, onMounted, ref } from 'vue'
import { useBlogStudio } from '~/composables/useBlogStudio'

const { listPosts, reindex, migrate, migrateMedia } = useBlogStudio()

// The importer route only exists in dev, so neither does the button.
const isDev = import.meta.dev

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

const migrating = ref(false)
const migrateMsg = ref('')
const migrateErrors = ref<string[]>([])

async function onMigrate(dryRun: boolean) {
  migrating.value = true
  migrateMsg.value = ''
  migrateErrors.value = []
  try {
    const res = await migrate(dryRun)
    migrateErrors.value = res.errors ?? []
    if (!res.ok)
      migrateMsg.value = 'Aborted — nothing was written. See the mismatches below.'
    else if (res.dryRun)
      migrateMsg.value = `Dry run OK: ${res.planned} posts ready to import.`
    else
      migrateMsg.value = `Imported ${res.wrote} posts, index holds ${res.indexed}.`
    if (res.ok && !res.dryRun)
      await refresh()
  }
  catch (e: unknown) {
    migrateMsg.value = e instanceof Error ? e.message : 'Import failed'
  }
  finally {
    migrating.value = false
  }
}

const mediaMigrating = ref(false)
const mediaMsg = ref('')
const mediaErrors = ref<string[]>([])

async function onMigrateMedia(dryRun: boolean) {
  mediaMigrating.value = true
  mediaMsg.value = ''
  mediaErrors.value = []
  try {
    const res = await migrateMedia(dryRun)
    mediaErrors.value = res.unsupported ?? []
    const posts = res.postsToRewrite?.length ?? 0
    mediaMsg.value = res.dryRun
      ? `Dry run: ${res.uploads} files to upload, ${res.skipped} already done, ${posts} posts to rewrite.`
      : `Uploaded ${res.uploads} files, added ${res.redirectsAdded} redirects, rewrote ${res.rewrote} posts.`
    if (!res.dryRun)
      await refresh()
  }
  catch (e: unknown) {
    mediaMsg.value = e instanceof Error ? e.message : 'Media import failed'
  }
  finally {
    mediaMigrating.value = false
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
        class="inline-flex items-center gap-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        <Icon name="mdi:plus" size="16" />
        New post
      </NuxtLink>

      <input
        v-model="query"
        type="search"
        placeholder="Filter by title, slug or tag…"
        class="flex-1 min-w-[12rem] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/60"
      >

      <button
        type="button"
        class="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline hover:cursor-pointer"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="errorMsg" class="mb-4 text-sm text-red-600 dark:text-red-400">
      {{ errorMsg }}
    </p>

    <p v-if="!loading" class="mb-3 font-spacemono text-xs text-slate-500 dark:text-slate-400">
      {{ posts.length }} posts · {{ draftCount }} draft{{ draftCount === 1 ? '' : 's' }}
    </p>

    <div v-if="loading" class="text-sm text-slate-500">
      Loading posts…
    </div>

    <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800/60 border-y border-slate-100 dark:border-slate-800/60">
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
            <span class="block font-medium text-slate-900 dark:text-slate-100 group-hover:text-accent-500 transition-colors">
              {{ post.title }}
            </span>
            <span class="block font-spacemono text-xs text-slate-500 dark:text-slate-400 truncate">
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

    <div class="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/60">
      <button
        type="button"
        class="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline hover:cursor-pointer"
        :disabled="reindexing"
        @click="onReindex"
      >
        {{ reindexing ? 'Rebuilding…' : 'Rebuild index' }}
      </button>
      <span class="ml-2 text-xs text-slate-500 dark:text-slate-400">
        Only needed if the public list disagrees with this one.
      </span>
      <p v-if="reindexMsg" class="mt-2 text-xs text-slate-600 dark:text-slate-300">
        {{ reindexMsg }}
      </p>
    </div>

    <div v-if="isDev" class="mt-6 rounded-md border border-dashed border-slate-300 dark:border-slate-700 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Import from content/blogs
      </h2>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        One-off migration of the markdown files into Firestore. Dev only — the route does not exist in production.
        Run the dry run first; it aborts on any file that cannot be matched to a live URL.
      </p>
      <div class="mt-3 flex gap-3">
        <button
          type="button"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs disabled:opacity-40 hover:cursor-pointer"
          :disabled="migrating"
          @click="onMigrate(true)"
        >
          Dry run
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 dark:bg-white px-3 py-1.5 text-xs text-white dark:text-slate-900 disabled:opacity-40 hover:cursor-pointer"
          :disabled="migrating"
          @click="onMigrate(false)"
        >
          {{ migrating ? 'Working…' : 'Import for real' }}
        </button>
      </div>
      <p v-if="migrateMsg" class="mt-2 text-xs text-slate-700 dark:text-slate-200">
        {{ migrateMsg }}
      </p>
      <ul v-if="migrateErrors.length" class="mt-2 list-disc pl-5 text-xs text-red-600 dark:text-red-400">
        <li v-for="err in migrateErrors" :key="err">
          {{ err }}
        </li>
      </ul>
    </div>

    <div v-if="isDev" class="mt-4 rounded-md border border-dashed border-slate-300 dark:border-slate-700 p-4">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Import images from public/blog-*
      </h2>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Uploads every file from <code>blog-cover</code>, <code>blog-content</code> and <code>blog-opengraph</code> to
        Storage, rewrites the covers, OG images and body links, and records a 301 for each old URL so nothing that
        Google or an outside page already links to breaks. Safe to re-run — files already mapped are skipped.
        Delete the three folders from <code>public/</code> once it reports success.
      </p>
      <div class="mt-3 flex gap-3">
        <button
          type="button"
          class="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs disabled:opacity-40 hover:cursor-pointer"
          :disabled="mediaMigrating"
          @click="onMigrateMedia(true)"
        >
          Dry run
        </button>
        <button
          type="button"
          class="rounded-md bg-slate-900 dark:bg-white px-3 py-1.5 text-xs text-white dark:text-slate-900 disabled:opacity-40 hover:cursor-pointer"
          :disabled="mediaMigrating"
          @click="onMigrateMedia(false)"
        >
          {{ mediaMigrating ? 'Working…' : 'Import for real' }}
        </button>
      </div>
      <p v-if="mediaMsg" class="mt-2 text-xs text-slate-700 dark:text-slate-200">
        {{ mediaMsg }}
      </p>
      <ul v-if="mediaErrors.length" class="mt-2 list-disc pl-5 text-xs text-amber-600 dark:text-amber-400">
        <li v-for="err in mediaErrors" :key="err">
          Skipped, unsupported type: {{ err }}
        </li>
      </ul>
    </div>
  </div>
</template>
