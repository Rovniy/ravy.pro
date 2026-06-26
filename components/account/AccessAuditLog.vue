<script setup lang="ts">
import type { AccessAuditEntry } from '~/types/access'
import { onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

const { authedFetch } = useAuthedFetch()
const entries = ref<AccessAuditEntry[]>([])
const cursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')

async function load(reset = true) {
  if (reset)
    loading.value = true
  else
    loadingMore.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ limit: '50' })
    if (!reset && cursor.value)
      params.set('before', cursor.value)
    const res = await authedFetch<{ entries: AccessAuditEntry[], nextCursor: string | null }>(`/api/admin/access/log?${params.toString()}`)
    entries.value = reset ? res.entries : [...entries.value, ...res.entries]
    cursor.value = res.nextCursor
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load the audit log'
  }
  finally {
    loading.value = false
    loadingMore.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso)
    return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function added(e: AccessAuditEntry) {
  return e.newTools.filter(t => !e.oldTools.includes(t))
}
function removed(e: AccessAuditEntry) {
  return e.oldTools.filter(t => !e.newTools.includes(t))
}

onMounted(() => load())
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Access audit log
        </h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Every access change — who, what, when. Newest first.
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
        @click="load(true)"
      >
        <Icon :name="loading ? 'svg-spinners:180-ring' : 'mdi:refresh'" size="14" />
        Refresh
      </button>
    </div>

    <p v-if="error" class="mt-3 text-sm text-rose-600 dark:text-rose-400">
      {{ error }}
    </p>

    <div v-if="loading" class="mt-4 text-sm text-slate-500">
      Loading…
    </div>
    <div v-else-if="entries.length === 0" class="mt-4 text-sm text-slate-500">
      No access changes recorded yet.
    </div>

    <ul v-else class="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
      <li v-for="entry in entries" :key="entry.id" class="py-3.5">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
            :class="entry.action === 'revoke'
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'"
          >
            {{ entry.action }}
          </span>
          <span class="font-spacemono text-xs text-slate-400">{{ formatDate(entry.createdAt) }}</span>
        </div>

        <p class="mt-1.5 text-sm text-slate-700 dark:text-slate-200">
          <span class="font-medium">{{ entry.adminEmail || 'unknown admin' }}</span>
          <span class="text-slate-400"> → </span>
          <span class="font-medium">{{ entry.targetEmail }}</span>
        </p>

        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            v-for="t in added(entry)"
            :key="`a-${t}`"
            class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
          >
            +{{ t }}
          </span>
          <span
            v-for="t in removed(entry)"
            :key="`r-${t}`"
            class="inline-flex items-center gap-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 text-xs text-rose-700 dark:text-rose-300 line-through"
          >
            −{{ t }}
          </span>
          <span v-if="!added(entry).length && !removed(entry).length" class="text-xs text-slate-400">
            no change
          </span>
          <span class="ml-1 font-spacemono text-xs text-slate-400">
            now: [{{ entry.newTools.join(', ') || '—' }}]
          </span>
        </div>
      </li>
    </ul>

    <div v-if="cursor" class="mt-4 flex justify-center">
      <button
        type="button"
        :disabled="loadingMore"
        class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
        @click="load(false)"
      >
        <Icon v-if="loadingMore" name="svg-spinners:180-ring" size="14" />
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>
  </section>
</template>
