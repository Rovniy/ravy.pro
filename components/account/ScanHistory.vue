<script setup lang="ts">
import type { ContractScanTeaser } from '~/types/contract-scan'
import { onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

interface Item { teaser: ContractScanTeaser, token: string }

const { authedFetch } = useAuthedFetch()
const items = ref<Item[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await authedFetch<{ items: Item[] }>('/api/account/contract-scans')
    items.value = res.items
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load scan history'
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

function resultLink(item: Item): string {
  // Always deep-link to the specific scan. Paid scans carry a durable token;
  // for the rest the result page authorizes the signed-in owner/admin via their
  // bearer token, or shows the teaser + unlock for an unpaid scan.
  const base = `/tools/contract-red-flag-scanner/result/${item.teaser.id}`
  return item.token ? `${base}?t=${item.token}` : base
}

onMounted(load)
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Red-Flag Scanner history
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
        No scans yet.
      </p>
      <NuxtLink to="/tools/contract-red-flag-scanner" class="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-600 dark:text-sky-400 hover:underline">
        <Icon name="mdi:arrow-right" class="w-4 h-4" /> Scan a contract
      </NuxtLink>
    </div>

    <div v-else class="mt-4 space-y-3">
      <article
        v-for="item in items"
        :key="item.teaser.id"
        class="rounded-md border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-spacemono">
            {{ formatDate(item.teaser.createdAt) }}
          </p>
          <p v-if="item.teaser.overallRiskScore" class="mt-1 text-sm text-slate-700 dark:text-slate-300">
            Overall risk: <span class="font-medium capitalize">{{ item.teaser.overallRiskScore.score }}</span>
            <span v-if="item.teaser.redFlagCounts" class="text-slate-500">· {{ item.teaser.redFlagCounts.total }} red flag(s)</span>
          </p>
          <p class="mt-1 text-sm font-medium" :class="item.teaser.paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
            {{ item.teaser.paid ? 'Unlocked' : 'Not unlocked' }}
          </p>
        </div>
        <NuxtLink
          :to="resultLink(item)"
          class="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Icon name="mdi:open-in-new" class="w-4 h-4" />
          {{ item.teaser.paid ? 'Open report' : 'View / unlock' }}
        </NuxtLink>
      </article>
    </div>
  </section>
</template>
