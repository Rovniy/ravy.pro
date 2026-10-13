<script setup lang="ts">
import type { TilNoteMeta } from '~/utils/til'
import { computed, onMounted, ref } from 'vue'
import { useTilStudio } from '~/composables/useTilStudio'
import { formatBlogDate } from '~/utils/helper'

const { listNotes } = useTilStudio()

const notes = ref<TilNoteMeta[]>([])
const loading = ref(true)
const errorMsg = ref('')

async function refresh() {
  loading.value = true
  errorMsg.value = ''
  try {
    notes.value = await listNotes()
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load notes'
  }
  finally {
    loading.value = false
  }
}

const drafts = computed(() => notes.value.filter(n => !n.published).length)

onMounted(refresh)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-2 mb-5">
      <NuxtLink
        to="/studio/notes/new"
        class="inline-flex items-center gap-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        <Icon name="mdi:plus" size="16" />
        New note
      </NuxtLink>
      <NuxtLink to="/til" target="_blank" class="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline">
        Open /til
      </NuxtLink>
      <button
        type="button"
        class="ml-auto text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white underline hover:cursor-pointer"
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
      {{ notes.length }} notes · {{ drafts }} draft{{ drafts === 1 ? '' : 's' }}
    </p>
    <div v-if="loading" class="text-sm text-slate-500">
      Loading notes…
    </div>

    <ul v-else class="divide-y divide-slate-100 dark:divide-slate-800/60 border-y border-slate-100 dark:border-slate-800/60">
      <li v-for="note in notes" :key="note.slug">
        <NuxtLink :to="`/studio/notes/${note.slug}`" class="flex items-start gap-3 py-3 group">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="note.published ? 'bg-green-500' : 'bg-amber-500'" :title="note.published ? 'Published' : 'Draft'" />
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-slate-900 dark:text-slate-100 group-hover:text-accent-500 transition-colors">{{ note.title }}</span>
            <span class="block font-spacemono text-xs text-slate-500 dark:text-slate-400 truncate">
              /til/{{ note.slug }} · {{ formatBlogDate(note.createdAt) }} · {{ note.topics.join(', ') }}
            </span>
          </span>
          <Icon name="mdi:chevron-right" size="18" class="mt-1 shrink-0 text-slate-400" />
        </NuxtLink>
      </li>
      <li v-if="!notes.length" class="py-6 text-sm text-slate-500">
        No notes yet. A note is a question as the title and a few lines with the fix.
      </li>
    </ul>
  </div>
</template>
