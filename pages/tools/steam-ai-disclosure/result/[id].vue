<script setup lang="ts">
import type { SteamAuditPublicRecord } from '~/types/steam-audit'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Your Steam AI Disclosure',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const id = computed(() => String(route.params.id || ''))

const record = ref<SteamAuditPublicRecord | null>(null)
const token = ref('')
const loadError = ref('')
const initialLoading = ref(true)
const copiedLink = ref(false)
const retrying = ref(false)
const autoRetried = ref(false)
const pollCount = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const status = computed(() => record.value?.status)
const isGenerating = computed(() => status.value === 'awaiting_payment' || status.value === 'paid' || status.value === 'processing')
const isError = computed(() => status.value === 'error')
const isDone = computed(() => status.value === 'done' && !!record.value?.result)
// ~40s of polling with no result → surface a manual retry without alarming early.
const slowGenerating = computed(() => isGenerating.value && pollCount.value > 26)

const durableUrl = computed(() => {
  if (!token.value || !import.meta.client)
    return ''
  return `${window.location.origin}/tools/steam-ai-disclosure/result/${id.value}?t=${token.value}`
})

function buildQuery(): Record<string, string> {
  const q: Record<string, string> = {}
  if (typeof route.query.t === 'string')
    q.t = route.query.t
  if (typeof route.query.session_id === 'string')
    q.session_id = route.query.session_id
  return q
}

function stopPolling() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startPolling() {
  stopPolling()
  timer = setInterval(() => {
    if (isGenerating.value)
      void fetchState()
    else
      stopPolling()
  }, 1500)
}

async function fetchState() {
  pollCount.value += 1
  try {
    const res = await $fetch<{ record: SteamAuditPublicRecord, token: string }>(`/api/steam-audit/${id.value}`, {
      query: buildQuery(),
    })
    record.value = res.record
    token.value = res.token
    loadError.value = ''

    // Swap the address bar to the durable token link so a refresh keeps working
    // and the one-time Stripe session_id stops lingering in history.
    if (import.meta.client && res.token && typeof route.query.session_id === 'string')
      window.history.replaceState({}, '', `/tools/steam-ai-disclosure/result/${id.value}?t=${res.token}`)

    if (res.record.status === 'done' || res.record.status === 'error')
      stopPolling()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    loadError.value = msg.includes('403') || msg.toLowerCase().includes('authoriz')
      ? 'This link is invalid or has expired. Open the link from your email, or contact contact@ravy.pro.'
      : 'Could not load your result. Please retry in a moment.'
    stopPolling()
  }
  finally {
    initialLoading.value = false
  }
}

async function retry() {
  if (retrying.value)
    return
  retrying.value = true
  try {
    await $fetch(`/api/steam-audit/${id.value}/retry`, { method: 'POST', query: buildQuery() })
    pollCount.value = 0
    if (record.value)
      record.value = { ...record.value, status: 'processing', step: 'Retrying…', progress: 20 }
    startPolling()
    await fetchState()
  }
  catch {
    loadError.value = 'Retry failed. Please contact contact@ravy.pro with this page URL — your payment is on record.'
  }
  finally {
    retrying.value = false
  }
}

async function copyLink() {
  if (!durableUrl.value)
    return
  try {
    await navigator.clipboard.writeText(durableUrl.value)
    copiedLink.value = true
    setTimeout(() => (copiedLink.value = false), 2200)
  }
  catch {
    // ignore
  }
}

// Generation failed → retry once automatically, then leave it to the user.
watch(isError, (failed) => {
  if (failed && !autoRetried.value) {
    autoRetried.value = true
    void retry()
  }
})

onMounted(() => {
  void fetchState()
  startPolling()
})

onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-3xl">
    <NuxtLink to="/tools/steam-ai-disclosure" class="inline-flex items-center gap-1.5 eyebrow hover:text-sky-500 transition-colors">
      <Icon name="mdi:arrow-left" class="w-3.5 h-3.5" /> Steam AI Disclosure
    </NuxtLink>

    <!-- Load / auth error -->
    <div v-if="loadError" class="mt-6 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-6">
      <h1 class="text-xl font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
        <Icon name="mdi:alert-circle-outline" class="w-6 h-6" /> Can't open this result
      </h1>
      <p class="mt-2 text-sm text-rose-700/90 dark:text-rose-300/90">
        {{ loadError }}
      </p>
    </div>

    <!-- Generation error — payment is safe, offer a free retry -->
    <div v-else-if="isError" class="mt-6 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6">
      <h1 class="text-xl font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <Icon name="mdi:wrench-outline" class="w-6 h-6" /> Generation hit a snag
      </h1>
      <p class="mt-2 text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
        Your payment is safe and your answers are saved — retrying does <strong>not</strong> charge you again.
        We already retried once automatically.
      </p>
      <button
        type="button"
        :disabled="retrying"
        class="mt-4 inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer transition"
        @click="retry"
      >
        <Icon :name="retrying ? 'svg-spinners:180-ring' : 'mdi:refresh'" class="w-5 h-5" />
        {{ retrying ? 'Retrying…' : 'Retry generation' }}
      </button>
      <p class="mt-3 text-xs text-amber-700/80 dark:text-amber-300/80">
        Still stuck? Email <a href="mailto:contact@ravy.pro" class="underline">contact@ravy.pro</a> with this page URL and we'll fix it or refund you.
      </p>
    </div>

    <!-- Loading / generating -->
    <div v-else-if="initialLoading || isGenerating" class="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
      <Icon name="svg-spinners:180-ring" class="w-10 h-10 mx-auto text-sky-500" />
      <h1 class="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        {{ status === 'awaiting_payment' ? 'Confirming your payment…' : 'Writing your disclosure pack…' }}
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {{ record?.step || 'This usually takes a few seconds.' }}
      </p>
      <div v-if="record" class="mt-5 max-w-xs mx-auto h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div class="h-full bg-sky-500 transition-all duration-500" :style="{ width: `${record.progress}%` }" />
      </div>

      <div v-if="slowGenerating" class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Taking longer than usual. Your payment is safe — you can retry without being charged again.
        </p>
        <button
          type="button"
          :disabled="retrying"
          class="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer transition"
          @click="retry"
        >
          <Icon :name="retrying ? 'svg-spinners:180-ring' : 'mdi:refresh'" class="w-4 h-4" />
          {{ retrying ? 'Retrying…' : 'Retry now' }}
        </button>
      </div>
    </div>

    <!-- Done -->
    <div v-else-if="isDone && record && record.result" class="mt-6 space-y-6">
      <header>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Icon name="mdi:check-decagram" class="w-7 h-7 text-emerald-500" />
          Your disclosure pack is ready
        </h1>
        <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Copy each block into the matching Steamworks field, then download your dated protocol.
        </p>
      </header>

      <!-- Save your link -->
      <div class="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Icon name="mdi:bookmark-outline" class="w-5 h-5 text-sky-500 shrink-0" />
        <p class="text-sm text-slate-600 dark:text-slate-300 flex-1">
          Save this private link to return to your pack anytime — we also emailed it to you.
        </p>
        <button
          type="button"
          class="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer transition"
          @click="copyLink"
        >
          <Icon :name="copiedLink ? 'mdi:check' : 'mdi:link-variant'" class="w-4 h-4" :class="copiedLink ? 'text-emerald-500' : ''" />
          {{ copiedLink ? 'Link copied' : 'Copy link' }}
        </button>
      </div>

      <SteamAuditDisclosurePack :result="record.result" :classification="record.classification" />

      <SteamAuditProtocolDocument :record="record" />
    </div>
  </div>
</template>
