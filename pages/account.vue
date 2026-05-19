<script setup lang="ts">
import type { ContractScanRecord } from '~/types/contract-scan'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
})

useGenericPageSchema({
  url: 'https://ravy.pro/account',
  name: 'Account Settings',
  description: 'Private account settings page.',
  type: 'WebPage',
})

useHead({
  title: 'Account Settings',
  meta: [
    { name: 'description', content: 'Private account settings page.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const { state, isAuthed, signIn, signOut, getIdToken } = useAuth()
const language = ref<'en' | 'ru'>('en')
const loading = ref(false)
const saving = ref(false)
const loadingHistory = ref(false)
const status = ref('')
const error = ref('')
const historyError = ref('')
const scans = ref<ContractScanRecord[]>([])
const selectedScanId = ref('')
const copiedShareFor = ref('')

async function authedFetch<T>(url: string, init: RequestInit = {}) {
  const token = await getIdToken(true)
  if (!token)
    throw new Error('Not authenticated')
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  const res = await fetch(url, { ...init, headers })
  if (!res.ok)
    throw new Error(await res.text())
  return res.json() as Promise<T>
}

async function loadProfile() {
  loading.value = true
  error.value = ''
  try {
    const profile = await authedFetch<{ language: 'en' | 'ru' }>('/api/account/profile')
    language.value = profile.language
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load profile'
  }
  finally {
    loading.value = false
  }
}

async function loadScanHistory() {
  loadingHistory.value = true
  historyError.value = ''
  try {
    const list = await authedFetch<ContractScanRecord[]>('/api/contract-scanner/scans?limit=30')
    scans.value = list
  }
  catch (e: unknown) {
    historyError.value = e instanceof Error ? e.message : 'Failed to load scan history'
  }
  finally {
    loadingHistory.value = false
  }
}

async function shareScan(scanId: string) {
  historyError.value = ''
  try {
    const data = await authedFetch<{ shareId: string }>(`/api/contract-scanner/scans/${scanId}/share`, {
      method: 'POST',
    })
    const url = `${window.location.origin}/scan-share/${data.shareId}`
    await navigator.clipboard.writeText(url)
    copiedShareFor.value = scanId
    setTimeout(() => {
      if (copiedShareFor.value === scanId)
        copiedShareFor.value = ''
    }, 2500)
  }
  catch (e: unknown) {
    historyError.value = e instanceof Error ? e.message : 'Failed to create share link'
  }
}

async function saveProfile() {
  saving.value = true
  status.value = ''
  error.value = ''
  try {
    await authedFetch('/api/account/profile', {
      method: 'POST',
      body: JSON.stringify({ language: language.value }),
    })
    status.value = 'Saved'
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save profile'
  }
  finally {
    saving.value = false
  }
}

watch(
  () => state.value.ready && isAuthed.value,
  (readyAuthed) => {
    if (readyAuthed) {
      void loadProfile()
      void loadScanHistory()
    }
  },
  { immediate: true },
)

function formatDate(iso?: string) {
  if (!iso)
    return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime()))
    return iso
  return d.toLocaleString()
}
</script>

<template>
  <main class="px-6 py-12 mx-auto w-full max-w-5xl">
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
      Account Settings
    </h1>

    <div v-if="!state.ready" class="mt-6 text-zinc-500">
      Loading…
    </div>

    <div v-else-if="!isAuthed" class="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50">
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        Please sign in to manage account settings.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
        @click="signIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
    </div>

    <div v-else class="mt-6 space-y-6">
      <section class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-slate-900 space-y-5">
        <div>
          <label class="block mb-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">Response language</label>
          <select
            v-model="language"
            :disabled="loading || saving"
            class="w-full max-w-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
          >
            <option value="en">
              English
            </option>
            <option value="ru">
              Русский
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="loading || saving"
            class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            @click="saveProfile"
          >
            <Icon :name="saving ? 'svg-spinners:180-ring' : 'mdi:content-save-outline'" size="16" />
            {{ saving ? 'Saving…' : 'Save settings' }}
          </button>
          <button
            type="button"
            class="text-sm underline hover:cursor-pointer"
            @click="signOut"
          >
            Sign out
          </button>
        </div>

        <p v-if="status" class="text-sm text-emerald-600 dark:text-emerald-400">
          {{ status }}
        </p>
        <p v-if="error" class="text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>
      </section>

      <section class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-slate-900">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Scan History
          </h2>
          <button
            type="button"
            :disabled="loadingHistory"
            class="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            @click="loadScanHistory"
          >
            <Icon :name="loadingHistory ? 'svg-spinners:180-ring' : 'mdi:refresh'" size="14" />
            Refresh
          </button>
        </div>

        <p v-if="historyError" class="mt-3 text-sm text-red-600 dark:text-red-400">
          {{ historyError }}
        </p>

        <div v-if="loadingHistory" class="mt-4 text-sm text-zinc-500">
          Loading scan history…
        </div>

        <div v-else-if="scans.length === 0" class="mt-4 text-sm text-zinc-500">
          No scans yet.
        </div>

        <div v-else class="mt-4 space-y-3">
          <article
            v-for="scan in scans"
            :key="scan.id"
            class="rounded-md border border-zinc-200 dark:border-zinc-700 p-4"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {{ formatDate(scan.createdAt) }}
              </p>
              <span
                class="text-xs uppercase font-semibold"
                :class="scan.status === 'done'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : scan.status === 'error'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-amber-600 dark:text-amber-400'"
              >
                {{ scan.status }}
              </span>
            </div>

            <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {{ scan.step }}
            </p>

            <p v-if="scan.result?.overallRiskScore" class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              Overall risk: <span class="font-medium capitalize">{{ scan.result.overallRiskScore.score }}</span>
            </p>

            <p v-if="scan.result?.summary" class="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
              {{ scan.result.summary }}
            </p>

            <div class="mt-3">
              <div v-if="scan.result" class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  @click="selectedScanId = selectedScanId === scan.id ? '' : scan.id"
                >
                  <Icon :name="selectedScanId === scan.id ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="16" />
                  {{ selectedScanId === scan.id ? 'Hide full report' : 'View full report' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  @click="shareScan(scan.id)"
                >
                  <Icon :name="copiedShareFor === scan.id ? 'mdi:check' : 'mdi:share-variant'" size="16" />
                  {{ copiedShareFor === scan.id ? 'Link copied' : 'Share report' }}
                </button>
              </div>
            </div>

            <p v-if="scan.error" class="mt-2 text-sm text-red-600 dark:text-red-400">
              {{ scan.error }}
            </p>

            <ContractScanResultPanel
              v-if="selectedScanId === scan.id && scan.result"
              :result="scan.result"
            />
          </article>
        </div>
      </section>
    </div>
  </main>
</template>
