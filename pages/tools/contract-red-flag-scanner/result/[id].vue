<script setup lang="ts">
import type { ContractScanPublicRecord, ContractScanTeaser } from '~/types/contract-scan'
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Your Contract Red-Flag Report',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const config = useRuntimeConfig()
const route = useRoute()
const { getIdToken } = useAuth()
const id = computed(() => String(route.params.id || ''))

const priceUsd = computed(() => {
  const raw = (config.public as Record<string, any>)?.contractScan?.priceUsd
  return (typeof raw === 'string' && raw.trim()) ? raw.trim() : '10'
})
const priceLabel = computed(() => `$${priceUsd.value}`)

type Mode = 'loading' | 'report' | 'paywall' | 'error'
const mode = ref<Mode>('loading')
const record = ref<ContractScanPublicRecord | null>(null)
const teaser = ref<ContractScanTeaser | null>(null)
const token = ref('')
const loadError = ref('')
const copiedLink = ref(false)
const isSharing = ref(false)
const shareError = ref('')
const copiedShare = ref(false)
const checkoutLoading = ref(false)
const checkoutError = ref('')

const result = computed(() => record.value?.result || null)

const durableUrl = computed(() => {
  if (!token.value || !import.meta.client)
    return ''
  return `${window.location.origin}/tools/contract-red-flag-scanner/result/${id.value}?t=${token.value}`
})

function buildQuery(): Record<string, string> {
  const q: Record<string, string> = {}
  if (typeof route.query.t === 'string')
    q.t = route.query.t
  if (typeof route.query.session_id === 'string')
    q.session_id = route.query.session_id
  return q
}

// Attach the Firebase token when signed in so the result endpoint can authorise
// the owner/admin even without a token or Stripe session in the URL.
async function authHeaders(): Promise<Record<string, string>> {
  const idToken = await getIdToken().catch(() => null)
  return idToken ? { Authorization: `Bearer ${idToken}` } : {}
}

async function loadTeaser() {
  try {
    teaser.value = await $fetch<ContractScanTeaser>(`/api/contract-scanner/scans/${id.value}`)
    mode.value = 'paywall'
  }
  catch {
    loadError.value = 'This report link is invalid or has expired. Open the link from your email, or contact contact@ravy.pro.'
    mode.value = 'error'
  }
}

async function fetchState() {
  try {
    const res = await $fetch<{ record: ContractScanPublicRecord, token: string }>(
      `/api/contract-scanner/result/${id.value}`,
      { query: buildQuery(), headers: await authHeaders() },
    )
    record.value = res.record
    token.value = res.token

    // Swap to the durable token link so a refresh keeps working and the
    // one-time Stripe session_id stops lingering in browser history.
    if (import.meta.client && res.token && typeof route.query.session_id === 'string')
      window.history.replaceState({}, '', `/tools/contract-red-flag-scanner/result/${id.value}?t=${res.token}`)

    mode.value = 'report'
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    // Not authorised yet (no payment) → fall back to the public teaser + paywall
    // so the owner can unlock this exact scan. Anything else is a real error.
    if (msg.includes('403') || msg.toLowerCase().includes('authoriz')) {
      await loadTeaser()
    }
    else {
      loadError.value = 'Could not load your report. Please retry in a moment.'
      mode.value = 'error'
    }
  }
}

async function startCheckout() {
  if (checkoutLoading.value)
    return
  checkoutLoading.value = true
  checkoutError.value = ''
  try {
    const res = await $fetch<{ url: string }>('/api/contract-scanner/checkout', {
      method: 'POST',
      headers: await authHeaders(),
      body: { scanId: id.value },
    })
    if (!res?.url)
      throw new Error('Checkout could not be created')
    window.location.href = res.url
  }
  catch (e: unknown) {
    checkoutError.value = e instanceof Error ? e.message : 'Failed to open checkout. Please try again.'
    checkoutLoading.value = false
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

async function shareReport() {
  if (isSharing.value)
    return
  isSharing.value = true
  shareError.value = ''
  copiedShare.value = false
  try {
    const data = await $fetch<{ shareId: string }>(`/api/contract-scanner/scans/${id.value}/share`, {
      method: 'POST',
      query: buildQuery(),
      headers: await authHeaders(),
    })
    const url = `${window.location.origin}/scan-share/${data.shareId}`
    await navigator.clipboard.writeText(url)
    copiedShare.value = true
    setTimeout(() => (copiedShare.value = false), 2500)
  }
  catch (e: unknown) {
    shareError.value = e instanceof Error ? e.message : 'Failed to create share link'
  }
  finally {
    isSharing.value = false
  }
}

onMounted(fetchState)
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-3xl">
    <NuxtLink to="/tools/contract-red-flag-scanner" class="inline-flex items-center gap-1.5 eyebrow hover:text-sky-500 transition-colors">
      <Icon name="mdi:arrow-left" class="w-3.5 h-3.5" /> Contract Red-Flag Scanner
    </NuxtLink>

    <!-- Load / auth error -->
    <div v-if="mode === 'error'" class="mt-6 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-6">
      <h1 class="text-xl font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
        <Icon name="mdi:alert-circle-outline" class="w-6 h-6" /> Can't open this report
      </h1>
      <p class="mt-2 text-sm text-rose-700/90 dark:text-rose-300/90">
        {{ loadError }}
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="mode === 'loading'" class="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
      <Icon name="svg-spinners:180-ring" class="w-10 h-10 mx-auto text-sky-500" />
      <h1 class="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        Opening your report…
      </h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        This usually takes a few seconds.
      </p>
    </div>

    <!-- Unpaid → teaser + unlock for this exact scan -->
    <div v-else-if="mode === 'paywall' && teaser" class="mt-6 space-y-4">
      <header>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Unlock this report
        </h1>
        <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          You've already scanned this contract — unlock the full report to see every flagged clause and how to fix it.
        </p>
      </header>
      <ContractScanTeaserPanel
        :teaser="teaser"
        :price-label="priceLabel"
        :loading="checkoutLoading"
        :error="checkoutError"
        @unlock="startCheckout"
      />
    </div>

    <!-- Done -->
    <div v-else-if="mode === 'report' && result" class="mt-6 space-y-6">
      <header>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Icon name="mdi:check-decagram" class="w-7 h-7 text-emerald-500" />
          Your red-flag report is ready
        </h1>
        <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Every flagged clause, why it matters, and how to fix it.
        </p>
      </header>

      <!-- Save your link -->
      <div class="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/20 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <Icon name="mdi:bookmark-outline" class="w-5 h-5 text-sky-500 shrink-0" />
        <p class="text-sm text-slate-600 dark:text-slate-300 flex-1">
          Save this private link to return to your report anytime — we also emailed it to you.
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

      <ContractScanResultPanel :result="result" />

      <div class="flex flex-col items-start gap-2">
        <button
          type="button"
          :disabled="isSharing"
          class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-base hover:bg-slate-100 dark:hover:bg-slate-800"
          :class="isSharing ? 'opacity-70 cursor-not-allowed' : ''"
          @click="shareReport"
        >
          <Icon :name="isSharing ? 'svg-spinners:180-ring' : copiedShare ? 'mdi:check' : 'mdi:share-variant'" size="18" />
          {{ isSharing ? 'Creating share link…' : copiedShare ? 'Link copied' : 'Share report' }}
        </button>
        <p v-if="shareError" class="text-sm text-red-600 dark:text-red-400">
          {{ shareError }}
        </p>
      </div>
    </div>
  </div>
</template>
