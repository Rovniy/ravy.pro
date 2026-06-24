<script setup lang="ts">
import type { ContractScanRecord } from '~/types/contract-scan'
import { onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

const { authedFetch } = useAuthedFetch()
const scans = ref<ContractScanRecord[]>([])
const loading = ref(false)
const error = ref('')
const selectedScanId = ref('')
const copiedShareFor = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    scans.value = await authedFetch<ContractScanRecord[]>('/api/contract-scanner/scans?limit=30')
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load scan history'
  }
  finally {
    loading.value = false
  }
}

async function shareScan(scanId: string) {
  error.value = ''
  try {
    const data = await authedFetch<{ shareId: string }>(`/api/contract-scanner/scans/${scanId}/share`, { method: 'POST' })
    const url = `${window.location.origin}/scan-share/${data.shareId}`
    await navigator.clipboard.writeText(url)
    copiedShareFor.value = scanId
    setTimeout(() => {
      if (copiedShareFor.value === scanId)
        copiedShareFor.value = ''
    }, 2500)
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to create share link'
  }
}

function formatDate(iso?: string) {
  if (!iso)
    return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
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
    <div v-else-if="scans.length === 0" class="mt-4 text-sm text-slate-500">
      No scans yet.
    </div>

    <div v-else class="mt-4 space-y-3">
      <article v-for="scan in scans" :key="scan.id" class="rounded-md border border-slate-200 dark:border-slate-700 p-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
            {{ formatDate(scan.createdAt) }}
          </p>
          <span
            class="text-xs uppercase font-semibold"
            :class="scan.status === 'done'
              ? 'text-emerald-600 dark:text-emerald-400'
              : scan.status === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-amber-600 dark:text-amber-400'"
          >
            {{ scan.status }}
          </span>
        </div>

        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {{ scan.step }}
        </p>
        <p v-if="scan.result?.overallRiskScore" class="mt-1 text-sm text-slate-700 dark:text-slate-300">
          Overall risk: <span class="font-medium capitalize">{{ scan.result.overallRiskScore.score }}</span>
        </p>
        <p v-if="scan.result?.summary" class="mt-2 text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
          {{ scan.result.summary }}
        </p>

        <div v-if="scan.result" class="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer"
            @click="selectedScanId = selectedScanId === scan.id ? '' : scan.id"
          >
            <Icon :name="selectedScanId === scan.id ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="16" />
            {{ selectedScanId === scan.id ? 'Hide full report' : 'View full report' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer"
            @click="shareScan(scan.id)"
          >
            <Icon :name="copiedShareFor === scan.id ? 'mdi:check' : 'mdi:share-variant'" size="16" />
            {{ copiedShareFor === scan.id ? 'Link copied' : 'Share report' }}
          </button>
        </div>

        <p v-if="scan.error" class="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {{ scan.error }}
        </p>

        <ContractScanResultPanel
          v-if="selectedScanId === scan.id && scan.result"
          :result="scan.result"
        />
      </article>
    </div>
  </section>
</template>
