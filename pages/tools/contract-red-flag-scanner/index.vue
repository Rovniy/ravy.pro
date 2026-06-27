<script setup lang="ts">
import type { ContractScanResult, ContractScanTeaser } from '~/types/contract-scan'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAccess } from '~/composables/useAccess'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default' })

const PUBLISHED = '2026-06-27'
const UPDATED = '2026-06-27'

const config = useRuntimeConfig()
const { state, isAuthed, getIdToken } = useAuth()
const { hasTool } = useAccess()
// Admins (and any legacy grant holder) read the full report for free.
const canSeeFreeFull = computed(() => hasTool('contract-scanner'))

const priceUsd = computed(() => {
  const raw = (config.public as Record<string, any>)?.contractScan?.priceUsd
  return (typeof raw === 'string' && raw.trim()) ? raw.trim() : '10'
})
const priceLabel = computed(() => `$${priceUsd.value}`)

const steps = [
  { icon: 'mdi:file-upload-outline', title: 'Paste or upload your contract', text: 'Paste the text, drop a PDF, or snap photos of the pages. No account needed.' },
  { icon: 'mdi:shield-search', title: 'Get your risk check — free', text: 'See the overall risk level, the jurisdiction, a plain-language summary, and how many red flags were found.' },
  { icon: 'mdi:lock-open-variant', title: 'Unlock the full report', text: `For ${priceLabel.value} see every flagged clause, why it is risky, a suggested fix, and your negotiation priorities.` },
]

const faqItems = computed(() => [
  { question: 'What does the Contract Red-Flag Scanner check?', answer: 'It reviews influencer, creator, UGC, and brand advertising agreements from the creator\'s side — flagging risky clauses around payment, usage rights, exclusivity, liability, termination, approvals, IP ownership, morality clauses, and more, plus hidden risks and missing protections.' },
  { question: 'Is this legal advice?', answer: 'No. It is informational risk-spotting to help a non-lawyer creator understand a contract before signing. For binding advice, consult a qualified lawyer in the relevant jurisdiction.' },
  { question: 'What is free and what costs money?', answer: `The risk check is free: overall risk level, jurisdiction, a summary, and the number of red flags by severity. For ${priceLabel.value} (one-time per scan) you unlock the full report — every flagged clause with the quote, why it is risky, your impact, a suggested fix, and negotiation priorities.` },
  { question: 'Do I need an account?', answer: 'No. You can scan and pay anonymously — we email your private report link and you can return to it anytime. If you are signed in, the scan is linked to your account automatically.' },
  { question: 'Can I scan a PDF or a photo of the contract?', answer: 'Yes. Upload a PDF or take photos of the pages on mobile — the text is extracted (with OCR when needed) and shown for your review before scanning.' },
  { question: 'Is my contract stored or shared?', answer: 'Your scan result is private to you. Reports are only shared if you explicitly create a share link. We do not sell or publish your contract.' },
])

useToolPageSchema({
  path: '/tools/contract-red-flag-scanner',
  title: 'Contract Red-Flag Scanner for Creators & Influencers',
  description: 'Scan an influencer or brand contract for risky clauses before you sign. Free risk check — overall risk, jurisdiction, and red-flag count; unlock the full clause-by-clause report with fixes and negotiation priorities for $10.',
  appName: 'Contract Red-Flag Scanner',
  appCategory: 'BusinessApplication',
  appDescription: 'Scans influencer/brand contracts for risky clauses and explains them in plain language, from the creator\'s side.',
  offer: { price: priceUsd.value, currency: 'usd' },
  datePublished: PUBLISHED,
  dateModified: UPDATED,
  howTo: {
    name: 'How to scan a contract for red flags',
    description: 'Paste or upload your contract, get a free risk check, then unlock the full clause-by-clause report.',
    steps: steps.map(s => ({ name: s.title, text: s.text })),
  },
  faq: faqItems.value,
})

// --- Input state ---
const contractText = ref('')
const fileName = ref('')
const fileMime = ref('')
const responseLanguage = ref('en')
const isExtracting = ref(false)
const isDragging = ref(false)
const inputStage = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)
const photoPages = ref<Array<{ name: string, mime: string, base64: string }>>([])

// --- Scan state ---
const scanId = ref('')
const teaser = ref<ContractScanTeaser | null>(null)
const fullResult = ref<ContractScanResult | null>(null)
const isSubmitting = ref(false)
const runError = ref('')
const checkoutLoading = ref(false)
const checkoutError = ref('')
let pollingTimer: ReturnType<typeof setInterval> | null = null

const route = useRoute()
const checkoutCancelled = computed(() => route.query.checkout === 'cancelled')

const hasInput = computed(() => contractText.value.trim().length > 0 || photoPages.value.length > 0)
const isRunning = computed(() => {
  const status = teaser.value?.status
  return isSubmitting.value || isExtracting.value || status === 'queued' || status === 'processing'
})
const scanDone = computed(() => teaser.value?.status === 'done')

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken().catch(() => null)
  const headers = new Headers(init.headers || {})
  headers.set('Content-Type', 'application/json')
  if (token)
    headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

// --- File / photo input (extraction is a public endpoint) ---
async function onFilePick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file)
    return

  fileName.value = file.name
  fileMime.value = file.type
  runError.value = ''
  contractText.value = ''

  const reader = new FileReader()
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.type.startsWith('image/')) {
    isExtracting.value = true
    inputStage.value = 'Reading file…'
    reader.onload = async () => {
      try {
        const base64 = typeof reader.result === 'string' ? reader.result : ''
        if (!base64)
          throw new Error('Failed to read file')
        inputStage.value = 'Extracting text from file…'
        const extracted = await apiFetch<{ text: string }>('/api/contract-scanner/extract-text', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileMime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
            fileBase64: base64,
          }),
        })
        contractText.value = extracted.text
        inputStage.value = 'Text extracted. Ready to scan.'
      }
      catch (e: unknown) {
        runError.value = e instanceof Error ? e.message : 'Could not extract text from the file. Try OCR or paste the text manually.'
      }
      finally {
        isExtracting.value = false
      }
    }
    reader.readAsDataURL(file)
    return
  }

  reader.onload = () => {
    const text = typeof reader.result === 'string' ? reader.result : ''
    if (text.trim())
      contractText.value = text
  }
  reader.readAsText(file)
}

function openFilePicker() {
  fileInputRef.value?.click()
}
function openPhotoPicker() {
  photoInputRef.value?.click()
}

async function onPhotoPick(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files?.length)
    return
  runError.value = ''
  isExtracting.value = true
  inputStage.value = 'Preparing photos…'
  try {
    const next: Array<{ name: string, mime: string, base64: string }> = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/'))
        continue
      const reader = new FileReader()
      inputStage.value = `Reading photo ${next.length + 1} of ${files.length}…`
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = () => reject(new Error('Failed to read photo'))
        reader.readAsDataURL(file)
      })
      if (base64)
        next.push({ name: file.name, mime: file.type, base64 })
    }
    photoPages.value = [...photoPages.value, ...next]
    fileName.value = `${photoPages.value.length} photo(s)`
    fileMime.value = 'image/*'
    inputStage.value = `Photos ready: ${photoPages.value.length}.`
  }
  catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : 'Failed to prepare photos'
  }
  finally {
    isExtracting.value = false
    input.value = ''
  }
}

function removePhoto(index: number) {
  photoPages.value = photoPages.value.filter((_, i) => i !== index)
  fileName.value = photoPages.value.length ? `${photoPages.value.length} photo(s)` : ''
  if (!photoPages.value.length)
    fileMime.value = ''
}
function clearPhotos() {
  photoPages.value = []
  fileName.value = ''
  fileMime.value = ''
  if (!contractText.value.trim())
    inputStage.value = ''
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (isRunning.value)
    return
  const file = event.dataTransfer?.files?.[0]
  if (!file)
    return
  const input = { files: event.dataTransfer?.files } as unknown as HTMLInputElement
  await onFilePick({ target: input } as unknown as Event)
}
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (!isRunning.value)
    isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}

// --- Scan lifecycle ---
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

async function fetchTeaser(id: string) {
  const result = await $fetch<ContractScanTeaser>(`/api/contract-scanner/scans/${id}`)
  teaser.value = result
  if (result.status === 'done' || result.status === 'error') {
    stopPolling()
    if (result.status === 'done' && canSeeFreeFull.value)
      await loadFullResult(id)
  }
}

function startPolling(id: string) {
  stopPolling()
  pollingTimer = setInterval(() => {
    void fetchTeaser(id)
  }, 1500)
}

async function loadFullResult(id: string) {
  try {
    const res = await apiFetch<{ record: { result?: ContractScanResult } }>(`/api/contract-scanner/result/${id}`)
    fullResult.value = res.record.result || null
  }
  catch {
    // Not authorized (not admin/owner-paid) — keep showing the teaser.
  }
}

async function runScan() {
  if (isRunning.value)
    return
  isSubmitting.value = true
  runError.value = ''
  teaser.value = null
  fullResult.value = null
  scanId.value = ''
  checkoutError.value = ''

  try {
    if (photoPages.value.length > 0) {
      isExtracting.value = true
      inputStage.value = 'Extracting text from selected photos…'
      const extracted = await apiFetch<{ text: string }>('/api/contract-scanner/extract-text', {
        method: 'POST',
        body: JSON.stringify({
          files: photoPages.value.map(p => ({ fileName: p.name, fileMime: p.mime, fileBase64: p.base64 })),
        }),
      })
      contractText.value = extracted.text
      isExtracting.value = false
      inputStage.value = 'Text extracted. Creating scan…'
    }

    inputStage.value = 'Analyzing your contract…'
    const created = await apiFetch<{ id: string }>('/api/contract-scanner/scans', {
      method: 'POST',
      body: JSON.stringify({
        text: contractText.value,
        fileName: fileName.value || undefined,
        fileMime: fileMime.value || undefined,
        responseLanguage: responseLanguage.value,
      }),
    })
    scanId.value = created.id
    await fetchTeaser(created.id)
    startPolling(created.id)
  }
  catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : 'Failed to start scan'
    inputStage.value = 'Failed to process the document.'
  }
  finally {
    isExtracting.value = false
    isSubmitting.value = false
  }
}

async function startCheckout() {
  if (checkoutLoading.value || !scanId.value)
    return
  checkoutLoading.value = true
  checkoutError.value = ''
  try {
    const res = await apiFetch<{ url: string }>('/api/contract-scanner/checkout', {
      method: 'POST',
      body: JSON.stringify({ scanId: scanId.value }),
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

function restart() {
  stopPolling()
  teaser.value = null
  fullResult.value = null
  scanId.value = ''
  runError.value = ''
  checkoutError.value = ''
}

onBeforeUnmount(stopPolling)

onMounted(() => {
  const locale = (navigator.language || 'en').toLowerCase()
  responseLanguage.value = locale.startsWith('ru') ? 'ru' : 'en'
})

// Prefill the response language from the signed-in user's profile.
watch(
  () => state.value.ready && isAuthed.value,
  async (readyAuthed) => {
    if (!readyAuthed)
      return
    try {
      const profile = await apiFetch<{ language: string }>('/api/account/profile')
      if (profile.language === 'ru' || profile.language === 'en')
        responseLanguage.value = profile.language
    }
    catch {
      // keep browser-locale fallback
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="max-w-3xl">
      <span class="eyebrow">Contracts · creator & brand deals</span>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
        Spot the red flags before you sign
      </h1>
      <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
        Paste an influencer or brand contract and get a free risk check in seconds — overall risk, jurisdiction,
        and how many traps it hides. Unlock the full clause-by-clause report when you need the details.
      </p>
      <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow">
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Not legal advice</span>
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Free risk check, no account</span>
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Full report {{ priceLabel }}</span>
      </p>
    </header>

    <div v-if="checkoutCancelled" class="mt-6 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-800 dark:text-amber-200">
      Checkout was cancelled — your scan is still here. You can unlock the full report whenever you're ready.
    </div>

    <!-- How it works -->
    <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="(s, i) in steps"
        :key="s.title"
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
      >
        <div class="flex items-center gap-2">
          <span class="font-spacemono text-xs text-sky-500">0{{ i + 1 }}</span>
          <Icon :name="s.icon" class="w-5 h-5 text-sky-500" />
        </div>
        <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100">
          {{ s.title }}
        </h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {{ s.text }}
        </p>
      </div>
    </div>

    <!-- Input -->
    <div class="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-white dark:bg-slate-900">
      <div class="mb-4 space-y-3">
        <input
          ref="fileInputRef"
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf,image/*"
          class="hidden"
          :disabled="isRunning"
          @change="onFilePick"
        >
        <input
          ref="photoInputRef"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          class="hidden"
          :disabled="isRunning"
          @change="onPhotoPick"
        >

        <button
          type="button"
          :disabled="isRunning"
          class="w-full rounded-lg border-2 border-dashed p-4 sm:p-5 text-left transition-colors disabled:opacity-60"
          :class="isDragging ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-sky-400'"
          @click="openFilePicker"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <p class="text-base font-medium text-slate-900 dark:text-slate-100">
            Drag and drop your contract here
          </p>
          <p class="mt-1 text-sm text-slate-500">
            or tap to choose a file (.txt, .pdf, image)
          </p>
        </button>

        <button
          type="button"
          :disabled="isRunning"
          class="sm:hidden w-full inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-base font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60"
          @click="openPhotoPicker"
        >
          <Icon name="mdi:camera" size="18" />
          Take photo (mobile)
        </button>

        <span v-if="fileName" class="block text-xs text-slate-500">{{ fileName }}</span>
        <span v-if="fileName && (fileMime === 'application/pdf' || fileMime.startsWith('image/'))" class="block text-xs text-slate-500">
          Text is extracted first and shown below for your review.
        </span>
        <div v-if="inputStage" class="flex items-center gap-2 text-xs text-slate-500">
          <Icon :name="isExtracting || isSubmitting ? 'svg-spinners:180-ring' : 'mdi:check-circle-outline'" size="14" />
          <span>{{ inputStage }}</span>
        </div>

        <div v-if="photoPages.length" class="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              Photos selected: {{ photoPages.length }}
            </p>
            <button type="button" class="text-sm underline" @click="clearPhotos">
              Clear all
            </button>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <div
              v-for="(photo, idx) in photoPages"
              :key="`${photo.name}-${idx}`"
              class="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <img :src="photo.base64" :alt="`photo-${idx + 1}`" class="w-full h-20 object-cover">
              <button
                type="button"
                class="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                @click="removePhoto(idx)"
              >
                <Icon name="mdi:close" size="12" />
              </button>
              <span class="absolute bottom-1 left-1 text-[10px] px-1 rounded bg-black/60 text-white">
                {{ idx + 1 }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <label class="block text-base">
        <span class="block mb-1 font-medium text-slate-900 dark:text-slate-100">Contract text</span>
        <textarea
          v-model="contractText"
          rows="12"
          placeholder="Paste your contract text here..."
          :disabled="isRunning"
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[16px] focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        />
      </label>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          :disabled="!hasInput || isRunning"
          class="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-base font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="runScan"
        >
          <Icon :name="isRunning ? 'svg-spinners:180-ring' : 'mdi:shield-search'" size="16" />
          {{ isRunning ? 'Scanning… Please wait' : 'Run free risk check' }}
        </button>
        <button
          v-if="teaser || fullResult"
          type="button"
          class="text-xs font-spacemono text-slate-400 hover:text-sky-500 transition-colors"
          @click="restart"
        >
          ↺ Start over
        </button>
      </div>

      <p v-if="runError" class="mt-3 text-base text-red-600 dark:text-red-400 break-words">
        {{ runError }}
      </p>

      <div v-if="teaser && isRunning" class="mt-4">
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>Status: {{ teaser.step }}</span>
          <span>{{ teaser.progress }}%</span>
        </div>
        <div class="h-2 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div class="h-full bg-sky-500 transition-all duration-500" :style="{ width: `${teaser.progress}%` }" />
        </div>
      </div>
    </div>

    <!-- Free full report (admin / authorized) -->
    <ContractScanResultPanel v-if="scanDone && fullResult" class="mt-8" :result="fullResult" />

    <!-- Teaser + paywall -->
    <ContractScanTeaserPanel
      v-else-if="scanDone && teaser"
      class="mt-8"
      :teaser="teaser"
      :price-label="priceLabel"
      :loading="checkoutLoading"
      :error="checkoutError"
      @unlock="startCheckout"
    />

    <!-- Scan error -->
    <section v-else-if="teaser?.status === 'error'" class="mt-8 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 sm:p-5">
      <h2 class="text-lg font-semibold text-red-700 dark:text-red-300">
        Scan failed
      </h2>
      <p class="mt-2 text-sm text-red-700/90 dark:text-red-300/90">
        {{ teaser.error || 'Unknown error during document analysis.' }}
      </p>
    </section>

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Why creator contracts need a red-flag check
      </h2>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What counts as a red flag?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Brand and influencer agreements often bury risk in dense language: perpetual or unlimited usage rights,
        broad exclusivity that blocks other deals, one-sided termination, vague approval loops, morality clauses,
        IP assignment of your own content, and payment terms that quietly push payout out by months. A red flag is
        any clause that shifts risk or cost onto you in a way a non-lawyer can easily miss.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What the free risk check shows
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        The free check gives you the overall risk level, the likely governing jurisdiction, a short plain-language
        summary, and the number of red flags found by severity — enough to decide whether the deal needs a closer look.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What the full report adds
      </h3>
      <ul class="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-5">
        <li>Each red flag with the exact clause quote and why it is risky</li>
        <li>What the clause means for you as the creator</li>
        <li>A concrete suggested fix or safer wording</li>
        <li>Hidden risks, missing protections, and questions to clarify</li>
        <li>Your negotiation priorities and fallback positions</li>
      </ul>

      <p class="mt-6 text-sm text-slate-400">
        Informational risk-spotting, not legal advice. For binding guidance consult a qualified lawyer.
      </p>
    </section>

    <!-- FAQ -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8">
      <span class="eyebrow">FAQ</span>
      <dl class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div v-for="item in faqItems" :key="item.question">
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            {{ item.question }}
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ item.answer }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
