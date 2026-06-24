<script setup lang="ts">
import type { SteamAuditPublicRecord } from '~/types/steam-audit'
import { onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

interface Item { record: SteamAuditPublicRecord, token: string }

const { authedFetch } = useAuthedFetch()
const items = ref<Item[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await authedFetch<{ items: Item[] }>('/api/account/steam-audits')
    items.value = res.items
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load history'
  }
  finally {
    loading.value = false
  }
}

function formatDate(iso?: string) {
  if (!iso)
    return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

function statusMeta(r: SteamAuditPublicRecord): { label: string, tone: string } {
  switch (r.status) {
    case 'done':
      return r.classification?.mustDisclose
        ? { label: 'Disclosure required', tone: 'text-rose-600 dark:text-rose-400' }
        : { label: 'No disclosure needed', tone: 'text-emerald-600 dark:text-emerald-400' }
    case 'error':
      return { label: 'Failed', tone: 'text-rose-600 dark:text-rose-400' }
    case 'awaiting_payment':
      return { label: 'Awaiting payment', tone: 'text-slate-500' }
    default:
      return { label: 'Generating…', tone: 'text-amber-600 dark:text-amber-400' }
  }
}

onMounted(load)
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Steam AI Disclosure
      </h2>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
        @click="load"
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

    <div v-else-if="items.length === 0" class="mt-4">
      <p class="text-sm text-slate-500">
        No audits yet.
      </p>
      <NuxtLink to="/tools/steam-ai-disclosure" class="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 hover:underline">
        <Icon name="mdi:arrow-right" class="w-4 h-4" /> Run a Steam AI disclosure check
      </NuxtLink>
    </div>

    <div v-else class="mt-4 space-y-3">
      <article
        v-for="item in items"
        :key="item.record.id"
        class="rounded-md border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p class="font-medium text-slate-900 dark:text-slate-100">
            {{ item.record.gameName || 'Untitled game' }}
          </p>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-spacemono">
            {{ formatDate(item.record.createdAt) }} · v{{ item.record.rulesetVersion }}
          </p>
          <p class="mt-1 text-sm font-medium" :class="statusMeta(item.record).tone">
            {{ statusMeta(item.record).label }}
          </p>
        </div>
        <NuxtLink
          :to="`/tools/steam-ai-disclosure/result/${item.record.id}?t=${item.token}`"
          class="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Icon name="mdi:open-in-new" class="w-4 h-4" />
          Open result
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
