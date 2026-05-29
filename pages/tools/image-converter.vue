<script setup lang="ts">
import type { OutputFormat } from '~/utils/image-convert'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  buildOutputName,
  formatBytes,
  FORMATS,
  getFormat,
  isSupportedInput,
  savingsPercent,
} from '~/utils/image-convert'

definePageMeta({
  layout: 'default',
})

useToolPageSchema({
  path: '/tools/image-converter',
  title: 'Image Converter',
  description: 'Convert images between PNG, JPEG, and WebP right in your browser. Batch-convert, adjust quality, see size savings, and download individually or as a ZIP — 100% private, nothing is uploaded.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Client-side image converter for PNG, JPEG, and WebP with batch processing and ZIP download.',
  appIsFree: true,
  faq: [
    {
      question: 'Are my images uploaded to a server?',
      answer: 'No. Conversion runs entirely in your browser using the Canvas API. Your images never leave your device.',
    },
    {
      question: 'Which formats are supported?',
      answer: 'You can convert between PNG, JPEG, and WebP in any direction. Files of those three types are accepted as input.',
    },
    {
      question: 'Why is GIF not supported?',
      answer: 'Browser canvas can only decode the first frame of a GIF and cannot encode GIF at all, so animated GIFs would be flattened and broken. We exclude GIF to avoid silently corrupting files.',
    },
    {
      question: 'What does the quality slider do?',
      answer: 'For lossy formats (JPEG and WebP) it trades file size for visual fidelity. PNG is lossless, so the slider is hidden when PNG is selected.',
    },
  ],
})

type ItemStatus = 'queued' | 'converting' | 'done' | 'error'
interface ConvItem {
  id: string
  file: File
  name: string
  originalSize: number
  status: ItemStatus
  outBlob?: Blob
  outUrl?: string
  outSize?: number
  outName?: string
  error?: string
  thumbUrl: string
}

const items = ref<ConvItem[]>([])
const targetFormat = ref<OutputFormat>('webp')
const quality = ref(0.8)
const isDragging = ref(false)
const isConverting = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const webpSupported = ref(true)
const rejectedNote = ref('')
const runVersion = ref(0)

const activeFormat = computed(() => getFormat(targetFormat.value))
const doneCount = computed(() => items.value.filter(i => i.status === 'done').length)
const hasDone = computed(() => doneCount.value > 0)
const queueLabel = computed(() => {
  if (isConverting.value)
    return `Converting… ${doneCount.value} of ${items.value.length} done`
  if (items.value.length)
    return `${doneCount.value} of ${items.value.length} done`
  return ''
})

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID()
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}`
}

// --- canvas conversion (browser-only) --------------------------------------
async function convertImage(file: File, format: OutputFormat, q: number): Promise<Blob> {
  const spec = getFormat(format)
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx)
      throw new Error('Canvas 2D context unavailable.')
    // JPEG has no alpha channel: paint white first so transparency doesn't turn black.
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    ctx.drawImage(bitmap, 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, spec.mime, spec.lossy ? q : undefined)
    })
    // Free the backing store for large images.
    canvas.width = 0
    canvas.height = 0
    if (!blob)
      throw new Error(`Your browser could not encode ${spec.label}.`)
    return blob
  }
  finally {
    bitmap.close()
  }
}

// --- object URL helpers ----------------------------------------------------
function revokeItemUrls(item: ConvItem) {
  if (item.thumbUrl)
    URL.revokeObjectURL(item.thumbUrl)
  if (item.outUrl)
    URL.revokeObjectURL(item.outUrl)
}

// --- queue -----------------------------------------------------------------
async function processQueue() {
  if (isConverting.value)
    return
  isConverting.value = true
  try {
    while (true) {
      const item = items.value.find(i => i.status === 'queued')
      if (!item)
        break
      item.status = 'converting'
      const version = runVersion.value
      try {
        const blob = await convertImage(item.file, targetFormat.value, quality.value)
        // Settings changed mid-flight — a fresh run is already queued; discard.
        if (version !== runVersion.value)
          return
        if (item.outUrl)
          URL.revokeObjectURL(item.outUrl)
        item.outBlob = blob
        item.outUrl = URL.createObjectURL(blob)
        item.outSize = blob.size
        item.outName = buildOutputName(item.name, getFormat(targetFormat.value).extension)
        item.error = undefined
        item.status = 'done'
      }
      catch (e) {
        if (version !== runVersion.value)
          return
        item.status = 'error'
        item.error = (e as Error).message || 'Conversion failed.'
      }
    }
  }
  finally {
    isConverting.value = false
  }
}

function reconvertAll() {
  runVersion.value++
  for (const item of items.value) {
    if (item.outUrl) {
      URL.revokeObjectURL(item.outUrl)
      item.outUrl = undefined
    }
    item.outBlob = undefined
    item.outSize = undefined
    item.outName = undefined
    item.error = undefined
    item.status = 'queued'
  }
  void processQueue()
}

const debouncedReconvert = useDebounceFn(reconvertAll, 300)

function selectFormat(id: OutputFormat) {
  if (id === 'webp' && !webpSupported.value)
    return
  if (targetFormat.value === id)
    return
  targetFormat.value = id
  reconvertAll()
}

function onQualityInput() {
  debouncedReconvert()
}

// --- adding files ----------------------------------------------------------
function addFiles(fileList: FileList | File[] | null | undefined) {
  if (!fileList)
    return
  const files = Array.from(fileList)
  const accepted: File[] = []
  let rejected = 0
  for (const file of files) {
    if (isSupportedInput(file))
      accepted.push(file)
    else
      rejected++
  }
  rejectedNote.value = rejected > 0
    ? `${rejected} file${rejected > 1 ? 's' : ''} skipped — only PNG, JPEG, and WebP are supported.`
    : ''

  for (const file of accepted) {
    items.value.push({
      id: genId(),
      file,
      name: file.name,
      originalSize: file.size,
      status: 'queued',
      thumbUrl: URL.createObjectURL(file),
    })
  }
  if (accepted.length)
    void processQueue()
}

// --- drag & drop / picker / paste ------------------------------------------
function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  addFiles(e.dataTransfer?.files)
}
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}
function openPicker() {
  fileInputRef.value?.click()
}
function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(input.files)
  input.value = ''
}
function onPaste(e: ClipboardEvent) {
  const files: File[] = []
  for (const item of Array.from(e.clipboardData?.items ?? [])) {
    if (item.kind === 'file') {
      const f = item.getAsFile()
      if (f)
        files.push(f)
    }
  }
  if (files.length)
    addFiles(files)
}

// --- downloads -------------------------------------------------------------
function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function downloadItem(item: ConvItem) {
  if (item.outUrl && item.outName)
    triggerDownload(item.outUrl, item.outName)
}

/** Ensure ZIP/download names are unique: a.webp, a (2).webp, … */
function dedupeName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const i = name.lastIndexOf('.')
  const base = i > 0 ? name.slice(0, i) : name
  const ext = i > 0 ? name.slice(i) : ''
  let n = 2
  let candidate = `${base} (${n})${ext}`
  while (used.has(candidate)) {
    n++
    candidate = `${base} (${n})${ext}`
  }
  used.add(candidate)
  return candidate
}

async function downloadZip() {
  const done = items.value.filter(i => i.status === 'done' && i.outBlob && i.outName)
  if (!done.length)
    return
  const used = new Set<string>()
  const entries: Record<string, Uint8Array> = {}
  for (const item of done) {
    const buf = new Uint8Array(await item.outBlob!.arrayBuffer())
    entries[dedupeName(item.outName!, used)] = buf
  }
  const { zipSync } = await import('fflate')
  // Images are already compressed — store without recompressing for speed.
  const zipped = zipSync(entries, { level: 0 })
  const blob = new Blob([zipped], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, 'images.zip')
  URL.revokeObjectURL(url)
}

// --- removal / cleanup -----------------------------------------------------
function removeItem(id: string) {
  const idx = items.value.findIndex(i => i.id === id)
  if (idx === -1)
    return
  revokeItemUrls(items.value[idx] as ConvItem)
  items.value.splice(idx, 1)
}
function clearAll() {
  for (const item of items.value)
    revokeItemUrls(item)
  items.value = []
  rejectedNote.value = ''
}

onMounted(() => {
  // Probe WebP encoding support (Safari historically lagged here).
  try {
    const c = document.createElement('canvas')
    c.width = 1
    c.height = 1
    webpSupported.value = c.toDataURL('image/webp').startsWith('data:image/webp')
  }
  catch {
    webpSupported.value = false
  }
  if (!webpSupported.value && targetFormat.value === 'webp')
    targetFormat.value = 'png'
  window.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  for (const item of items.value)
    revokeItemUrls(item)
})

const STATUS_META: Record<ItemStatus, { icon: string, classes: string, label: string }> = {
  queued: { icon: 'mdi:clock-outline', classes: 'text-zinc-400', label: 'Queued' },
  converting: { icon: 'svg-spinners:180-ring', classes: 'text-sky-500', label: 'Converting' },
  done: { icon: 'mdi:check-circle', classes: 'text-emerald-500', label: 'Done' },
  error: { icon: 'mdi:alert-circle', classes: 'text-rose-500', label: 'Error' },
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <header class="mb-6">
      <h1 class="text-3xl font-bold tracking-tight">
        Image Converter
      </h1>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        Convert images between PNG, JPEG, and WebP. Drop files, get downloads.
      </p>
    </header>

    <!-- Privacy banner -->
    <div class="mb-6 flex items-start gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-600 dark:text-zinc-300">
      <Icon name="mdi:shield-check" size="20" class="shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
      <p>Everything runs in your browser. Your images never leave this page.</p>
    </div>

    <!-- Top controls -->
    <div class="sticky top-0 z-10 mb-6 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur p-4">
      <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div>
          <span class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Convert to</span>
          <div class="inline-flex rounded-md border border-zinc-300 dark:border-zinc-700 p-0.5">
            <button
              v-for="f in FORMATS"
              :key="f.id"
              type="button"
              :disabled="f.id === 'webp' && !webpSupported"
              :title="f.id === 'webp' && !webpSupported ? 'Your browser can\'t encode WebP' : undefined"
              class="px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
              :class="targetFormat === f.id
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              @click="selectFormat(f.id)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="activeFormat.lossy" class="min-w-[200px]">
          <label for="quality" class="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Quality — {{ Math.round(quality * 100) }}%
          </label>
          <input
            id="quality"
            v-model.number="quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            class="w-full accent-sky-500"
            :aria-valuetext="`${Math.round(quality * 100)}% quality`"
            @input="onQualityInput"
          >
        </div>
      </div>
    </div>

    <!-- Dropzone -->
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:cursor-pointer"
      :class="isDragging
        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-900/20'
        : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'"
      aria-label="Add images: drag and drop, click to browse, or paste from clipboard"
      @click="openPicker"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <Icon name="mdi:image-plus-outline" size="36" class="mx-auto text-zinc-400" aria-hidden="true" />
      <p class="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Drag &amp; drop images here
      </p>
      <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        or click to browse · paste from clipboard · PNG, JPEG, WebP
      </p>
    </button>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      multiple
      class="hidden"
      @change="onPick"
    >

    <p v-if="rejectedNote" class="mt-3 text-sm text-amber-600 dark:text-amber-400">
      {{ rejectedNote }}
    </p>

    <!-- Batch actions -->
    <div v-if="items.length" class="mt-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        :disabled="!hasDone"
        class="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
        @click="downloadZip"
      >
        <Icon name="mdi:folder-zip-outline" size="16" aria-hidden="true" />
        Download all (ZIP)
      </button>
      <button
        type="button"
        class="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:cursor-pointer"
        @click="clearAll"
      >
        Clear
      </button>
      <span class="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">{{ queueLabel }}</span>
    </div>

    <!-- Results grid -->
    <div v-if="items.length" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative rounded-md border border-zinc-200 dark:border-zinc-800 p-4"
      >
        <button
          type="button"
          class="absolute right-2 top-2 rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:cursor-pointer"
          aria-label="Remove"
          @click="removeItem(item.id)"
        >
          <Icon name="mdi:close" size="16" aria-hidden="true" />
        </button>

        <img :src="item.thumbUrl" :alt="item.name" class="h-32 w-full rounded object-cover bg-zinc-100 dark:bg-zinc-800">

        <p class="mt-3 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100" :title="item.name">
          {{ item.name }}
        </p>

        <div class="mt-1 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{{ formatBytes(item.originalSize) }}</span>
          <template v-if="item.status === 'done' && item.outSize !== undefined">
            <Icon name="mdi:arrow-right" size="12" aria-hidden="true" />
            <span class="text-zinc-700 dark:text-zinc-200">{{ formatBytes(item.outSize) }}</span>
            <span
              class="rounded-full px-1.5 py-0.5 font-medium"
              :class="savingsPercent(item.originalSize, item.outSize) >= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'"
            >
              {{ savingsPercent(item.originalSize, item.outSize) >= 0
                ? `${savingsPercent(item.originalSize, item.outSize)}% smaller`
                : `${-savingsPercent(item.originalSize, item.outSize)}% larger` }}
            </span>
          </template>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="STATUS_META[item.status].classes">
            <Icon :name="STATUS_META[item.status].icon" size="14" aria-hidden="true" />
            {{ STATUS_META[item.status].label }}
          </span>
          <button
            v-if="item.status === 'done'"
            type="button"
            class="inline-flex items-center gap-1 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-2.5 py-1.5 text-xs font-medium hover:opacity-90 hover:cursor-pointer"
            @click="downloadItem(item)"
          >
            <Icon name="mdi:download" size="14" aria-hidden="true" />
            Download
          </button>
        </div>
        <p v-if="item.status === 'error'" class="mt-2 text-xs text-rose-500">
          {{ item.error }}
        </p>
      </div>
    </div>

    <!-- About / FAQ -->
    <section class="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8 text-sm text-zinc-600 dark:text-zinc-300">
      <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        About this tool
      </h2>
      <p class="mt-2">
        Convert images between <span class="font-medium">PNG</span>, <span class="font-medium">JPEG</span>, and
        <span class="font-medium">WebP</span> without uploading anything. Pick a target format, drop one or many
        files, and each is decoded and re-encoded locally with the browser's Canvas API — then download them one
        by one or all at once as a ZIP.
      </p>

      <h2 class="mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        FAQ
      </h2>
      <dl class="mt-2 space-y-4">
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Are my images uploaded to a server?
          </dt>
          <dd class="mt-1">
            No. Conversion runs entirely in your browser using the Canvas API. Your images never leave your device.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Which formats are supported?
          </dt>
          <dd class="mt-1">
            You can convert between PNG, JPEG, and WebP in any direction. Files of those three types are accepted as input.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Why is GIF not supported?
          </dt>
          <dd class="mt-1">
            Browser canvas can only decode the first frame of a GIF and cannot encode GIF at all, so animated GIFs would be flattened and broken. We exclude GIF to avoid silently corrupting files.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            What does the quality slider do?
          </dt>
          <dd class="mt-1">
            For lossy formats (JPEG and WebP) it trades file size for visual fidelity. PNG is lossless, so the slider is hidden when PNG is selected.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
