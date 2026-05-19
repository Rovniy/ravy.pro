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
const shareError = ref('')
const copiedShare = ref(false)
const isSharing = ref(false)
const isSubmitting = ref(false)
const isExtractingPdf = ref(false)
const isDragging = ref(false)
const inputStage = ref('')
const { state, isAuthed, isAdmin, signIn, signOut, getIdToken } = useAuth()
let pollingTimer: ReturnType<typeof setInterval> | null = null
const fileInputRef = ref<HTMLInputElement | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)
const photoPages = ref<Array<{ name: string, mime: string, base64: string }>>([])

const hasInput = computed(() => {
  return contractText.value.trim().length > 0 || photoPages.value.length > 0
})
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
    inputStage.value = 'Reading file…'
    reader.onload = async () => {
      try {
        const base64 = typeof reader.result === 'string' ? reader.result : ''
        if (!base64)
          throw new Error('Failed to read file')

        inputStage.value = 'Extracting text from file…'
        const extracted = await authedFetch<{ text: string }>('/api/contract-scanner/extract-text', {
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
    inputStage.value = `Photos ready: ${photoPages.value.length}.`
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
    copiedShare.value = false
    shareError.value = ''
    if (photoPages.value.length > 0) {
      isExtractingPdf.value = true
      inputStage.value = 'Extracting text from selected photos…'
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
      inputStage.value = 'Text extracted. Creating scan task…'
    }

    inputStage.value = 'Sending document for GPT analysis…'
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
    inputStage.value = 'Scan started. Waiting for analysis status…'
    await fetchScanState(created.id)
    startPolling(created.id)
  }
  catch (e: unknown) {
    runError.value = e instanceof Error ? e.message : 'Failed to start scan'
    inputStage.value = 'Failed to process file.'
  }
  finally {
    isExtractingPdf.value = false
    isSubmitting.value = false
  }
}

async function shareCurrentScan() {
  if (isSharing.value)
    return
  shareError.value = ''
  copiedShare.value = false
  isSharing.value = true
  try {
    const id = scanState.value?.id || scanId.value
    if (!id)
      throw new Error('Scan id not found')
    const data = await authedFetch<{ shareId: string }>(`/api/contract-scanner/scans/${id}/share`, {
      method: 'POST',
    })
    const url = `${window.location.origin}/scan-share/${data.shareId}`
    await navigator.clipboard.writeText(url)
    copiedShare.value = true
    setTimeout(() => {
      copiedShare.value = false
    }, 2500)
  }
  catch (e: unknown) {
    shareError.value = e instanceof Error ? e.message : 'Failed to create share link'
  }
  finally {
    isSharing.value = false
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
        <div v-if="inputStage" class="flex items-center gap-2 text-xs text-zinc-500">
          <Icon :name="isExtractingPdf || isSubmitting ? 'svg-spinners:180-ring' : 'mdi:check-circle-outline'" size="14" />
          <span>{{ inputStage }}</span>
        </div>

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

    <ContractScanResultPanel
      v-if="isAuthed && isAdmin && scanState?.status === 'done' && scanResult"
      class="mt-8"
      :result="scanResult"
    />

    <section
      v-if="isAuthed && isAdmin && scanState?.status === 'done' && scanResult"
      class="mt-4 flex flex-col items-start gap-2"
    >
      <button
        type="button"
        :disabled="isSharing"
        class="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-base hover:bg-zinc-100 dark:hover:bg-zinc-800"
        :class="isSharing ? 'opacity-70 cursor-not-allowed' : ''"
        @click="shareCurrentScan"
      >
        <Icon :name="isSharing ? 'svg-spinners:180-ring' : copiedShare ? 'mdi:check' : 'mdi:share-variant'" size="18" />
        {{ isSharing ? 'Creating share link…' : copiedShare ? 'Link copied' : 'Share scan result' }}
      </button>
      <p v-if="shareError" class="text-sm text-red-600 dark:text-red-400">
        {{ shareError }}
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
