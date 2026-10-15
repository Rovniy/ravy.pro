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
        class="skew-box btn btn-primary btn-sm"
      >
        <Icon name="mdi:plus" size="16" />
        New note
      </NuxtLink>
      <NuxtLink to="/til" target="_blank" class="text-xs text-fg-muted hover:text-fg underline">
        Open /til
      </NuxtLink>
      <button
        type="button"
        class="ml-auto text-xs text-fg-muted hover:text-fg underline hover:cursor-pointer"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="errorMsg" class="mb-4 text-sm text-danger">
      {{ errorMsg }}
    </p>
    <p v-if="!loading" class="mb-3 font-spacemono text-xs text-fg-muted">
      {{ notes.length }} notes · {{ drafts }} draft{{ drafts === 1 ? '' : 's' }}
    </p>
    <div v-if="loading" class="text-sm text-fg-muted">
      Loading notes…
    </div>

    <ul v-else class="divide-y divide-line border-y border-line">
      <li v-for="note in notes" :key="note.slug">
        <NuxtLink :to="`/studio/notes/${note.slug}`" class="flex items-start gap-3 py-3 group">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="note.published ? 'bg-ok' : 'bg-warn'" :title="note.published ? 'Published' : 'Draft'" />
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-fg group-hover:text-accent-500 transition-colors">{{ note.title }}</span>
            <span class="block font-spacemono text-xs text-fg-muted truncate">
              /til/{{ note.slug }} · {{ formatBlogDate(note.createdAt) }} · {{ note.topics.join(', ') }}
            </span>
          </span>
          <Icon name="mdi:chevron-right" size="18" class="mt-1 shrink-0 text-fg-subtle" />
        </NuxtLink>
      </li>
      <li v-if="!notes.length" class="py-6 text-sm text-fg-muted">
        No notes yet. A note is a question as the title and a few lines with the fix.
      </li>
    </ul>
  </div>
</template>
