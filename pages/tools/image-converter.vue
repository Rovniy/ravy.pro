<script setup lang="ts">
import type { OutputFormat } from '~/utils/image-convert'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { transformToSrgb } from '~/utils/color-transform'
import { embedIccProfile, extractIccProfile, readIccDescription } from '~/utils/icc'
import {
  buildOutputName,
  formatBytes,
  FORMATS,
  getFormat,
  isSupportedInput,
  savingsPercent,
} from '~/utils/image-convert'

type ColorMode = 'srgb' | 'preserve'

definePageMeta({
  layout: 'default',
})

const faqItems = [
  {
    question: 'Are my images uploaded to a server?',
    answer: 'No. Conversion runs entirely in your browser using the Canvas API. Your images never leave your device — nothing is uploaded anywhere.',
  },
  {
    question: 'Which image formats are supported?',
    answer: 'You can convert between PNG, JPEG, and WebP in any direction. Files of those three types are accepted as input.',
  },
  {
    question: 'Why is GIF not supported?',
    answer: 'Browser canvas can only decode the first frame of a GIF and cannot encode GIF at all, so animated GIFs would be flattened and broken. GIF is intentionally excluded to avoid silently corrupting files.',
  },
  {
    question: 'Can I convert many images at once?',
    answer: 'Yes. Drop or paste any number of files and they run through a sequential queue with a per-file status. When they are done you can download each one or grab them all together with “Download all (ZIP)”.',
  },
  {
    question: 'Does the quality slider apply to PNG?',
    answer: 'No. The quality slider only affects lossy formats — JPEG and WebP — where it trades file size for visual fidelity. PNG is lossless, so the slider is hidden when PNG is the target format.',
  },
  {
    question: 'Does it handle ICC color profiles?',
    answer: 'Yes. “Convert to sRGB” color-manages wide-gamut images (Display P3, Adobe RGB, etc.) to standard sRGB using Little CMS so colors stay accurate. “Preserve original” keeps the source profile and re-embeds it — JPEG via APP2, PNG via iCCP. WebP cannot embed a profile, so it falls back to sRGB.',
  },
  {
    question: 'Is there a file size or count limit?',
    answer: 'There is no hard limit imposed by the tool. Because everything is processed locally, the practical ceiling is your device’s memory — very large images or very long queues are bounded by the RAM available to the browser tab.',
  },
]

useToolPageSchema({
  path: '/tools/image-converter',
  title: 'Image Converter',
  description: 'Convert images between PNG, JPEG, and WebP right in your browser. Batch-convert, adjust quality, see size savings, and download individually or as a ZIP — 100% private, nothing is uploaded.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Client-side image converter for PNG, JPEG, and WebP with batch processing and ZIP download.',
  appIsFree: true,
  datePublished: '2026-05-20',
  dateModified: '2026-06-26',
  howTo: {
    name: 'How to convert an image',
    description: 'Convert PNG, JPEG, and WebP images privately in your browser, then download them individually or as a ZIP.',
    steps: [
      { name: 'Add your images', text: 'Add images by drag-and-drop, by clicking to browse, or by pasting from the clipboard. PNG, JPEG, and WebP are accepted.' },
      { name: 'Choose format and options', text: 'Pick the output format (PNG, JPEG, or WebP), set the quality for lossy formats, and choose color-profile handling — convert to sRGB or preserve the original ICC profile.' },
      { name: 'Convert and download', text: 'Each file is converted locally, then download them one by one or all at once as a ZIP.' },
    ],
  },
  faq: faqItems,
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
  profileName?: string | null
  colorNote?: string
}

const items = ref<ConvItem[]>([])
const targetFormat = ref<OutputFormat>('webp')
const colorMode = ref<ColorMode>('srgb')
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

interface ConversionResult {
  blob: Blob
  profileName: string | null
  note: string
}

function newCanvas(w: number, h: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('Canvas 2D context unavailable.')
  return { canvas, ctx }
}

async function canvasToBlob(canvas: HTMLCanvasElement, spec: { mime: string, label: string, lossy: boolean }, q: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, spec.mime, spec.lossy ? q : undefined)
  })
  if (!blob)
    throw new Error(`Your browser could not encode ${spec.label}.`)
  return blob
}

/** Composite over white for JPEG (no alpha) so transparency doesn't go black. */
function flattenForJpeg(source: HTMLCanvasElement, format: OutputFormat): HTMLCanvasElement {
  if (format !== 'jpeg')
    return source
  const { canvas, ctx } = newCanvas(source.width, source.height)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0)
  return canvas
}

// --- canvas conversion + color management (browser-only) -------------------
async function convertImage(file: File, format: OutputFormat, q: number, mode: ColorMode): Promise<ConversionResult> {
  const spec = getFormat(format)
  const srcBytes = new Uint8Array(await file.arrayBuffer())
  const srcProfile = extractIccProfile(srcBytes, file.type)
  const profileName = srcProfile ? (readIccDescription(srcProfile) || 'Embedded ICC profile') : null

  // Decide the colour pipeline.
  let doTransform = false
  let doEmbed = false
  let note = ''
  if (srcProfile) {
    if (mode === 'preserve' && format !== 'webp') {
      doEmbed = true
      note = 'Original profile embedded'
    }
    else if (mode === 'preserve') {
      doTransform = true
      note = 'WebP can’t embed ICC — converted to sRGB'
    }
    else {
      doTransform = true
      note = 'Converted to sRGB'
    }
  }

  // Decode without the browser's automatic colour management so the raw,
  // profile-encoded pixels reach Little CMS unchanged.
  const bitmap = await createImageBitmap(file, { colorSpaceConversion: 'none' })
  try {
    const { canvas: draw, ctx } = newCanvas(bitmap.width, bitmap.height)
    ctx.drawImage(bitmap, 0, 0)

    if (doTransform && srcProfile) {
      const imageData = ctx.getImageData(0, 0, draw.width, draw.height)
      const transformed = await transformToSrgb(imageData.data, srcProfile)
      imageData.data.set(transformed)
      ctx.putImageData(imageData, 0, 0)
    }

    let blob = await canvasToBlob(flattenForJpeg(draw, format), spec, q)
    draw.width = 0
    draw.height = 0

    if (doEmbed && srcProfile) {
      const embedded = embedIccProfile(new Uint8Array(await blob.arrayBuffer()), srcProfile, spec.mime)
      if (embedded)
        blob = new Blob([embedded], { type: spec.mime })
      else
        note = 'Profile could not be embedded'
    }

    return { blob, profileName, note }
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
        const result = await convertImage(item.file, targetFormat.value, quality.value, colorMode.value)
        // Settings changed mid-flight — a fresh run is already queued; discard.
        if (version !== runVersion.value)
          return
        if (item.outUrl)
          URL.revokeObjectURL(item.outUrl)
        item.outBlob = result.blob
        item.outUrl = URL.createObjectURL(result.blob)
        item.outSize = result.blob.size
        item.outName = buildOutputName(item.name, getFormat(targetFormat.value).extension)
        item.profileName = result.profileName
        item.colorNote = result.note
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
    item.profileName = undefined
    item.colorNote = undefined
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

function selectColorMode(mode: ColorMode) {
  if (colorMode.value === mode)
    return
  colorMode.value = mode
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
  queued: { icon: 'mdi:clock-outline', classes: 'text-slate-400', label: 'Queued' },
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
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Convert images between PNG, JPEG, and WebP. Drop files, get downloads.
      </p>
    </header>

    <!-- Privacy banner -->
    <div class="mb-6 flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
      <Icon name="mdi:shield-check" size="20" class="shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
      <p>Everything runs in your browser. Your images never leave this page.</p>
    </div>

    <!-- Top controls -->
    <div class="sticky top-0 z-10 mb-6 rounded-md border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur p-4">
      <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
        <div>
          <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Convert to</span>
          <div class="inline-flex rounded-md border border-slate-300 dark:border-slate-700 p-0.5">
            <button
              v-for="f in FORMATS"
              :key="f.id"
              type="button"
              :disabled="f.id === 'webp' && !webpSupported"
              :title="f.id === 'webp' && !webpSupported ? 'Your browser can\'t encode WebP' : undefined"
              class="px-3 py-1.5 text-sm font-medium rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
              :class="targetFormat === f.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
              @click="selectFormat(f.id)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="activeFormat.lossy" class="min-w-[200px]">
          <label for="quality" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
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

        <div>
          <span class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Color profile</span>
          <div class="inline-flex rounded-md border border-slate-300 dark:border-slate-700 p-0.5">
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium rounded transition-colors hover:cursor-pointer"
              :class="colorMode === 'srgb'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
              title="Color-manage to standard sRGB (best for the web)"
              @click="selectColorMode('srgb')"
            >
              Convert to sRGB
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium rounded transition-colors hover:cursor-pointer"
              :class="colorMode === 'preserve'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
              title="Keep the original embedded ICC profile (JPEG/PNG)"
              @click="selectColorMode('preserve')"
            >
              Preserve original
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dropzone -->
    <button
      type="button"
      class="w-full rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:cursor-pointer"
      :class="isDragging
        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-900/20'
        : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'"
      aria-label="Add images: drag and drop, click to browse, or paste from clipboard"
      @click="openPicker"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <Icon name="mdi:image-plus-outline" size="36" class="mx-auto text-slate-400" aria-hidden="true" />
      <p class="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
        Drag &amp; drop images here
      </p>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
        class="inline-flex items-center gap-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
        @click="downloadZip"
      >
        <Icon name="mdi:folder-zip-outline" size="16" aria-hidden="true" />
        Download all (ZIP)
      </button>
      <button
        type="button"
        class="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:cursor-pointer"
        @click="clearAll"
      >
        Clear
      </button>
      <span class="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">{{ queueLabel }}</span>
    </div>

    <!-- Results grid -->
    <div v-if="items.length" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="relative rounded-md border border-slate-200 dark:border-slate-800 p-4"
      >
        <button
          type="button"
          class="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:cursor-pointer"
          aria-label="Remove"
          @click="removeItem(item.id)"
        >
          <Icon name="mdi:close" size="16" aria-hidden="true" />
        </button>

        <img :src="item.thumbUrl" :alt="item.name" class="h-32 w-full rounded object-cover bg-slate-100 dark:bg-slate-800">

        <p class="mt-3 truncate text-sm font-medium text-slate-800 dark:text-slate-100" :title="item.name">
          {{ item.name }}
        </p>

        <div class="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ formatBytes(item.originalSize) }}</span>
          <template v-if="item.status === 'done' && item.outSize !== undefined">
            <Icon name="mdi:arrow-right" size="12" aria-hidden="true" />
            <span class="text-slate-700 dark:text-slate-200">{{ formatBytes(item.outSize) }}</span>
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

        <p
          v-if="item.status === 'done' && item.profileName"
          class="mt-1 flex items-center gap-1 text-[11px] text-slate-400 truncate"
          :title="`${item.profileName}${item.colorNote ? ` — ${item.colorNote}` : ''}`"
        >
          <Icon name="mdi:palette-outline" size="12" class="shrink-0" aria-hidden="true" />
          <span class="truncate">{{ item.profileName }}<template v-if="item.colorNote"> · {{ item.colorNote }}</template></span>
        </p>

        <div class="mt-3 flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 text-xs font-medium" :class="STATUS_META[item.status].classes">
            <Icon :name="STATUS_META[item.status].icon" size="14" aria-hidden="true" />
            {{ STATUS_META[item.status].label }}
          </span>
          <button
            v-if="item.status === 'done'"
            type="button"
            class="inline-flex items-center gap-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2.5 py-1.5 text-xs font-medium hover:opacity-90 hover:cursor-pointer"
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

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Converting images in your browser, explained
      </h2>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        How does this image converter work?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        It converts images between <strong>PNG</strong>, <strong>JPEG</strong>, and <strong>WebP</strong> entirely
        on your device. Each file is decoded and re-encoded locally with the browser's
        <strong>Canvas API</strong> — the images are <em>never uploaded to a server</em>. Pick a target format,
        add one or many files, and download them individually or all at once as a ZIP.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Are my images private?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Yes. Because conversion happens in the browser, nothing is sent anywhere — no upload, no account, no
        server-side processing. The files stay on your machine for the whole conversion, which makes the tool
        suitable for sensitive or unreleased images.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Which formats and options are supported?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        You can convert between PNG, JPEG, and WebP in any direction. A quality slider tunes the trade-off between
        file size and fidelity for the lossy formats (JPEG and WebP); PNG is lossless, so the slider is hidden when
        it is selected. JPEG output paints a white background so transparent areas don't turn black. Animated
        <strong>GIF is intentionally not supported</strong> — the canvas can only read a GIF's first frame and
        cannot encode GIF, so converting one would silently break it.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        How are ICC color profiles handled?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Wide-gamut images are color-managed with Little CMS. <strong>Convert to sRGB</strong> maps Display P3,
        Adobe RGB, and similar profiles to standard sRGB so colors stay accurate on the web. <strong>Preserve
          original</strong> re-embeds the source profile — JPEG via APP2, PNG via iCCP. WebP can't embed a profile,
        so it falls back to sRGB.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Can I batch-convert many images?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Yes. Drop, click, or paste any number of files and they run through a sequential queue with a per-file
        status. Each card shows the size before and after conversion, and you can download results one by one or
        bundle them all with <strong>Download all (ZIP)</strong>. There is no hard file-size or count limit — the
        practical ceiling is your device's available memory.
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
