<script setup lang="ts">
import type { ContractScanRecord, ContractScanResult } from '~/types/contract-scan'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
})

useToolPageSchema({
  path: '/tools/contract-red-flag-scanner',
  title: 'Contract Red-Flag Scanner for Influencers',
  description: 'Scan influencer brand contracts for 10 common red flags. Fast informational review with clear plain-language explanations.',
  appDescription: 'Private contract scanner for finding risky influencer-brand clauses before signing.',
})

const contractText = ref('')
const fileName = ref('')
const fileMime = ref('')
const responseLanguage = ref('en')
const scanId = ref('')
const scanState = ref<ContractScanRecord | null>(null)
const signInError = ref('')
const runError = ref('')
const isSubmitting = ref(false)
const isExtractingPdf = ref(false)
const isDragging = ref(false)
const { state, isAuthed, isAdmin, signIn, signOut, getIdToken } = useAuth()
let pollingTimer: ReturnType<typeof setInterval> | null = null
const fileInputRef = ref<HTMLInputElement | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)
const photoPages = ref<Array<{ name: string, mime: string, base64: string }>>([])

const hasInput = computed(() => contractText.value.trim().length > 0)
const isRunning = computed(() => {
  const status = scanState.value?.status
  return isSubmitting.value || isExtractingPdf.value || status === 'queued' || status === 'processing'
})
const scanResult = computed<ContractScanResult | null>(() => scanState.value?.result || null)

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
  if (
    file.type === 'application/pdf'
    || file.name.toLowerCase().endsWith('.pdf')
    || file.type.startsWith('image/')
  ) {
    isExtractingPdf.value = true
    reader.onload = async () => {
      try {
        const base64 = typeof reader.result === 'string' ? reader.result : ''
        if (!base64)
          throw new Error('Failed to read file')

        const extracted = await authedFetch<{ text: string }>('/api/contract-scanner/extract-text', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileMime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : ''),
            fileBase64: base64,
          }),
        })
        contractText.value = extracted.text
      }
      catch (e: unknown) {
        runError.value = e instanceof Error
          ? e.message
          : 'Не удалось извлечь текст из PDF. Попробуй OCR или вставь текст вручную.'
      }
      finally {
        isExtractingPdf.value = false
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
  isExtractingPdf.value = true
  try {
    const next: Array<{ name: string, mime: string, base64: string }> = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/'))
        continue
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
        reader.onerror = () => reject(new Error('Failed to read photo'))
        reader.readAsDataURL(file)
      })
      if (base64) {
        next.push({
          name: file.name,
          mime: file.type,
          base64,
        })
      }
    }
    photoPages.value = [...photoPages.value, ...next]
    fileName.value = `${photoPages.value.length} photo(s)`
    fileMime.value = 'image/*'
  }
  catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : 'Failed to prepare photos'
  }
  finally {
    isExtractingPdf.value = false
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

async function authedFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getIdToken(true)
  if (!token)
    throw new Error('Not authenticated')
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')

  const res = await fetch(url, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

async function fetchScanState(id: string) {
  const result = await authedFetch<ContractScanRecord>(`/api/contract-scanner/scans/${id}`)
  scanState.value = result
  if (result.status === 'done' || result.status === 'error')
    stopPolling()
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

function startPolling(id: string) {
  stopPolling()
  pollingTimer = setInterval(() => {
    void fetchScanState(id)
  }, 1500)
}

async function runScan() {
  if (isRunning.value)
    return

  isSubmitting.value = true
  runError.value = ''
  scanState.value = null
  scanId.value = ''

  try {
    if (photoPages.value.length > 0) {
      isExtractingPdf.value = true
      const extracted = await authedFetch<{ text: string }>('/api/contract-scanner/extract-text', {
        method: 'POST',
        body: JSON.stringify({
          files: photoPages.value.map(p => ({
            fileName: p.name,
            fileMime: p.mime,
            fileBase64: p.base64,
          })),
        }),
      })
      contractText.value = extracted.text
      isExtractingPdf.value = false
    }

    const created = await authedFetch<{ id: string }>(
      '/api/contract-scanner/scans',
      {
        method: 'POST',
        body: JSON.stringify({
          text: contractText.value,
          fileName: fileName.value || undefined,
          fileMime: fileMime.value || undefined,
          responseLanguage: responseLanguage.value,
        }),
      },
    )
    scanId.value = created.id
    await fetchScanState(created.id)
    startPolling(created.id)
  }
  catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : 'Failed to start scan'
  }
  finally {
    isExtractingPdf.value = false
    isSubmitting.value = false
  }
}

async function onSignIn() {
  signInError.value = ''
  try {
    await signIn()
  }
  catch (e: unknown) {
    signInError.value = e instanceof Error ? e.message : 'Sign-in failed'
  }
}

onBeforeUnmount(() => {
  stopPolling()
})

onMounted(() => {
  const locale = (navigator.language || 'en').toLowerCase()
  responseLanguage.value = locale.startsWith('ru') ? 'ru' : 'en'
})

watch(
  () => state.value.ready && isAuthed.value,
  async (readyAuthed) => {
    if (!readyAuthed)
      return
    try {
      const profile = await authedFetch<{ language: string }>('/api/account/profile')
      if (profile.language === 'ru' || profile.language === 'en')
        responseLanguage.value = profile.language
    }
    catch {
      // Keep browser-locale fallback when profile not available yet.
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl text-[18px] leading-relaxed">
    <header class="mb-6 sm:mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        Contract Red-Flag Scanner
      </h1>
      <p class="mt-2 text-base text-zinc-600 dark:text-zinc-400">
        Check influencer brand contracts for 10 common traps before you sign.
      </p>
    </header>

    <div v-if="!state.ready" class="text-zinc-500">
      Loading…
    </div>

    <div v-else-if="!isAuthed" class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-900/50">
      <h2 class="text-lg font-semibold mb-2">
        Sign in required
      </h2>
      <p class="text-base text-zinc-600 dark:text-zinc-400 mb-4">
        This service is private and available only to the site owner.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-base font-medium hover:opacity-90 hover:cursor-pointer"
        @click="onSignIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
      <p v-if="signInError" class="mt-3 text-base text-red-600 dark:text-red-400">
        {{ signInError }}
      </p>
    </div>

    <div v-else-if="!isAdmin" class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 sm:p-6">
      <h2 class="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">
        Access denied
      </h2>
      <p class="text-base text-red-700/80 dark:text-red-300/80 mb-4">
        Your account <strong>{{ state.user?.email }}</strong> is not authorized to use this service.
      </p>
      <button type="button" class="text-sm underline hover:cursor-pointer" @click="signOut">
        Sign out
      </button>
    </div>

    <div v-else class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 bg-white dark:bg-slate-900">
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
          :class="isDragging ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-sky-400'"
          @click="openFilePicker"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
        >
          <p class="text-base font-medium text-zinc-900 dark:text-zinc-100">
            Drag and drop document here
          </p>
          <p class="mt-1 text-sm text-zinc-500">
            or tap to choose a file (.txt, .pdf, image)
          </p>
        </button>

        <button
          type="button"
          :disabled="isRunning"
          class="sm:hidden w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-base font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
          @click="openPhotoPicker"
        >
          <Icon name="mdi:camera" size="18" />
          Take photo (mobile)
        </button>

        <span v-if="fileName" class="block text-xs text-zinc-500">{{ fileName }}</span>
        <span v-if="fileName && (fileMime === 'application/pdf' || fileMime.startsWith('image/'))" class="block text-xs text-zinc-500">
          Text is extracted first and shown below for your review.
        </span>
        <span v-if="isExtractingPdf" class="block text-xs text-zinc-500">
          Extracting text from file…
        </span>

        <div v-if="photoPages.length" class="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              Photos selected: {{ photoPages.length }}
            </p>
            <button
              type="button"
              class="text-sm underline"
              @click="clearPhotos"
            >
              Clear all
            </button>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-5 gap-2">
            <div
              v-for="(photo, idx) in photoPages"
              :key="`${photo.name}-${idx}`"
              class="relative rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700"
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
        <span class="block mb-1 font-medium text-zinc-900 dark:text-zinc-100">Document text</span>
        <textarea
          v-model="contractText"
          rows="12"
          placeholder="Paste contract text here..."
          :disabled="isRunning"
          class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-[18px] focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </label>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          :disabled="!hasInput || isRunning"
          class="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-base font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="runScan"
        >
          <Icon :name="isRunning ? 'svg-spinners:180-ring' : 'mdi:shield-search'" size="16" />
          {{ isRunning ? 'Scanning… Please wait' : 'Run Red-Flag Scan' }}
        </button>
      </div>

      <p v-if="runError" class="mt-3 text-base text-red-600 dark:text-red-400 break-words">
        {{ runError }}
      </p>

      <div v-if="scanState" class="mt-4">
        <div class="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          <span>Status: {{ scanState.step }}</span>
          <span>{{ scanState.progress }}%</span>
        </div>
        <div class="h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            class="h-full bg-sky-500 transition-all duration-500"
            :style="{ width: `${scanState.progress}%` }"
          />
        </div>
      </div>
    </div>

    <section v-if="isAuthed && isAdmin && scanState?.status === 'done' && scanResult" class="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 bg-white dark:bg-slate-900">
      <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:file-search-outline" size="20" />
        Scan Results
      </h2>
      <p class="mt-1 text-base text-zinc-600 dark:text-zinc-400">
        Found {{ flaggedCount }} potential red flags, including {{ highCount }} high-risk items.
      </p>
      <div class="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50/60 dark:bg-zinc-900/40">
        <p class="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2">
          <Icon name="mdi:gauge" size="16" />
          Overall risk
        </p>
        <p class="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
          {{ scanResult.overallRiskScore.score }}
        </p>
        <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {{ scanResult.overallRiskScore.reason }}
        </p>
      </div>
      <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/40 dark:bg-zinc-900/30">
          <p class="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Icon name="mdi:translate" size="16" />
            Language
          </p>
          <p class="font-medium text-zinc-900 dark:text-zinc-100">
            {{ scanResult.language }}
          </p>
        </div>
        <div class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/40 dark:bg-zinc-900/30">
          <p class="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span>{{ jurisdictionFlag(scanResult.jurisdiction) }}</span>
            Jurisdiction
          </p>
          <p class="font-medium text-zinc-900 dark:text-zinc-100">
            {{ scanResult.jurisdiction }}
          </p>
        </div>
      </div>
      <p class="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
        {{ scanResult.summary }}
      </p>

      <div v-if="scanResult.narrowPoints?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:tune-vertical" size="16" />
          Narrow Points
        </h3>
        <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li v-for="(point, idx) in scanResult.narrowPoints" :key="`${idx}-${point.slice(0, 20)}`">
            {{ point }}
          </li>
        </ul>
      </div>

      <div v-if="scanResult.hiddenRisks?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:eye-off-outline" size="16" />
          Hidden Risks
        </h3>
        <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li v-for="(risk, idx) in scanResult.hiddenRisks" :key="`${idx}-${risk.slice(0, 20)}`">
            {{ risk }}
          </li>
        </ul>
      </div>

      <div v-if="scanResult.missingProtections?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:shield-alert-outline" size="16" />
          Missing Protections
        </h3>
        <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li v-for="(risk, idx) in scanResult.missingProtections" :key="`${idx}-${risk.slice(0, 20)}`">
            {{ risk }}
          </li>
        </ul>
      </div>

      <div v-if="scanResult.questionsToClarify?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:help-circle-outline" size="16" />
          Questions to Clarify
        </h3>
        <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
          <li v-for="(q, idx) in scanResult.questionsToClarify" :key="`${idx}-${q.slice(0, 20)}`">
            {{ q }}
          </li>
        </ul>
      </div>

      <div v-if="scanResult.creatorNegotiationPriorities?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:handshake-outline" size="16" />
          Negotiation Priorities
        </h3>
        <div class="mt-2 space-y-3">
          <article
            v-for="(item, idx) in scanResult.creatorNegotiationPriorities"
            :key="`${idx}-${item.priority}`"
            class="rounded-md border border-zinc-200 dark:border-zinc-700 p-3"
          >
            <p class="font-medium text-zinc-900 dark:text-zinc-100">
              {{ item.priority }}
            </p>
            <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              {{ item.whyItMatters }}
            </p>
            <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
              Fallback: {{ item.fallbackPosition }}
            </p>
          </article>
        </div>
      </div>

      <div v-if="sortedRedFlags.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Icon name="mdi:alert-decagram-outline" size="16" />
          Red Flags (sorted by severity)
        </h3>
        <article
          v-for="(item, idx) in sortedRedFlags"
          :key="`${idx}-${item.title}`"
          class="rounded-lg border p-4"
          :class="item.severity === 'high'
            ? 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/20'
            : item.severity === 'medium'
              ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/20'
              : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/40'"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icon :name="severityIcon(item.severity)" size="16" />
              {{ item.title }}
            </h3>
            <span class="text-xs uppercase font-semibold" :class="item.severity === 'high' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'">
              {{ item.severity }}
            </span>
          </div>
          <p class="mt-2 text-sm text-zinc-700 dark:text-zinc-300 break-words">
            Clause: <code class="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 break-words">{{ item.clauseQuote }}</code>
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Risk type: <span class="font-medium">{{ item.riskType }}</span>
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {{ item.whyRisky }}
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Creator impact: {{ item.creatorImpact }}
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Suggested action: {{ item.suggestion }}
          </p>
        </article>
      </div>

      <p v-else class="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        No obvious red flags matched these 10 patterns. This does not mean the contract is safe.
      </p>
    </section>

    <section v-if="isAuthed && isAdmin && scanState?.status === 'error'" class="mt-8 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4 sm:p-5">
      <h2 class="text-lg font-semibold text-red-700 dark:text-red-300">
        Scan Failed
      </h2>
      <p class="mt-2 text-sm text-red-700/90 dark:text-red-300/90">
        {{ scanState.error || 'Unknown error during document analysis.' }}
      </p>
    </section>
  </main>
</template>
