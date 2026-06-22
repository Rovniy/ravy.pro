<script setup lang="ts">
import type QRCodeStyling from 'qr-code-styling'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'default',
})

const route = useRoute()

function readQueryData(): string {
  const raw = route.query.data
  if (typeof raw === 'string' && raw.trim())
    return raw
  if (Array.isArray(raw) && raw[0])
    return String(raw[0])
  return 'https://ravy.pro'
}

useToolPageSchema({
  path: '/tools/qr-code-generator',
  title: 'Free QR Code Generator',
  description: 'Create custom QR codes online for links, text, and contacts. Configure style, colors, and logo, then download PNG for free.',
  ogImage: '/open_graph/pages/qr-code-generator.png',
  appDescription: 'Online QR code generator with style, color, and logo customization.',
  appIsFree: true,
  faq: [
    {
      question: 'How do I create a QR code?',
      answer: 'Paste your URL or text, choose style and colors, then download PNG.',
    },
    {
      question: 'Can I add a logo to the QR code?',
      answer: 'Yes. Upload a center image to place your logo over the generated QR code.',
    },
    {
      question: 'Is this QR code generator free?',
      answer: 'Yes. You can generate and download styled QR codes for free.',
    },
  ],
})

type DotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
type CornerSquareType = 'square' | 'dot' | 'extra-rounded'
type CornerDotType = 'square' | 'dot'

const data = ref(readQueryData())
const size = ref(512)
const margin = ref(10)
const dotStyle = ref<DotType>('rounded')
const cornerSquareStyle = ref<CornerSquareType>('extra-rounded')
const cornerDotStyle = ref<CornerDotType>('dot')
const fgColor = ref('#0f172a')
const bgColor = ref('#ffffff')
const image = ref<string>('')
const imageSize = ref(0.3)
const hideBgDots = ref(true)

const previewRef = ref<HTMLDivElement | null>(null)
let qrCode: QRCodeStyling | null = null

const canDownload = computed(() => data.value.trim().length > 0)

function buildOptions() {
  return {
    width: size.value,
    height: size.value,
    type: 'canvas' as const,
    data: data.value || ' ',
    image: image.value || undefined,
    margin: margin.value,
    qrOptions: {
      errorCorrectionLevel: (image.value ? 'H' : 'M') as 'H' | 'M',
    },
    dotsOptions: {
      type: dotStyle.value,
      color: fgColor.value,
    },
    cornersSquareOptions: {
      type: cornerSquareStyle.value,
      color: fgColor.value,
    },
    cornersDotOptions: {
      type: cornerDotStyle.value,
      color: fgColor.value,
    },
    backgroundOptions: {
      color: bgColor.value,
    },
    imageOptions: {
      crossOrigin: 'anonymous' as const,
      margin: 4,
      imageSize: imageSize.value,
      hideBackgroundDots: hideBgDots.value,
    },
  }
}

const debouncedUpdate = useDebounceFn(() => {
  if (qrCode)
    qrCode.update(buildOptions())
}, 50)

watch(previewRef, async (el) => {
  if (!el) {
    qrCode = null
    return
  }
  if (qrCode)
    return
  try {
    const mod = await import('qr-code-styling')
    const QRCodeStyling = mod.default
    qrCode = new QRCodeStyling(buildOptions())
    qrCode.append(el)
  }
  catch (e) {
    console.error('Failed to init QR code', e)
  }
}, { flush: 'post' })

watch(
  [data, size, margin, dotStyle, cornerSquareStyle, cornerDotStyle, fgColor, bgColor, image, imageSize, hideBgDots],
  () => debouncedUpdate(),
)

onBeforeUnmount(() => {
  qrCode = null
})

function onImagePick(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => {
    image.value = typeof reader.result === 'string' ? reader.result : ''
  }
  reader.readAsDataURL(file)
}

function clearImage() {
  image.value = ''
  const input = document.getElementById('qr-image-input') as HTMLInputElement | null
  if (input)
    input.value = ''
}

function download() {
  if (!qrCode || !canDownload.value)
    return
  qrCode.download({ name: `qr-${Date.now()}`, extension: 'png' })
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        Free QR Code Generator
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Generate a styled QR code, optionally with a center image, and download as PNG.
      </p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Form -->
      <form class="space-y-4 text-sm" @submit.prevent>
        <div>
          <label class="block mb-1 font-medium" for="qr-data">Data</label>
          <textarea
            id="qr-data"
            v-model="data"
            rows="3"
            placeholder="https://ravy.pro"
            class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1 font-medium" for="qr-size">Size: {{ size }}px</label>
            <input id="qr-size" v-model.number="size" type="range" min="200" max="1024" step="32" class="w-full">
          </div>
          <div>
            <label class="block mb-1 font-medium" for="qr-margin">Margin: {{ margin }}</label>
            <input id="qr-margin" v-model.number="margin" type="range" min="0" max="50" step="2" class="w-full">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block mb-1 font-medium" for="qr-dot">Dot style</label>
            <select id="qr-dot" v-model="dotStyle" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
              <option value="square">
                square
              </option>
              <option value="rounded">
                rounded
              </option>
              <option value="dots">
                dots
              </option>
              <option value="classy">
                classy
              </option>
              <option value="classy-rounded">
                classy-rounded
              </option>
              <option value="extra-rounded">
                extra-rounded
              </option>
            </select>
          </div>
          <div>
            <label class="block mb-1 font-medium" for="qr-corner-sq">Corner square</label>
            <select id="qr-corner-sq" v-model="cornerSquareStyle" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
              <option value="square">
                square
              </option>
              <option value="dot">
                dot
              </option>
              <option value="extra-rounded">
                extra-rounded
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 items-end">
          <div>
            <label class="block mb-1 font-medium" for="qr-corner-dot">Corner dot</label>
            <select id="qr-corner-dot" v-model="cornerDotStyle" class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
              <option value="square">
                square
              </option>
              <option value="dot">
                dot
              </option>
            </select>
          </div>
          <div>
            <label class="block mb-1 font-medium" for="qr-fg">Foreground</label>
            <input id="qr-fg" v-model="fgColor" type="color" class="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
          </div>
          <div>
            <label class="block mb-1 font-medium" for="qr-bg">Background</label>
            <input id="qr-bg" v-model="bgColor" type="color" class="w-full h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer">
          </div>
        </div>

        <div>
          <label class="block mb-1 font-medium" for="qr-image-input">Center image (optional)</label>
          <div class="flex items-center gap-2">
            <input
              id="qr-image-input"
              type="file"
              accept="image/*"
              class="flex-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-slate-900 dark:file:bg-white file:text-white dark:file:text-slate-900 file:px-3 file:py-1.5 file:hover:opacity-90 file:cursor-pointer"
              @change="onImagePick"
            >
            <button
              v-if="image"
              type="button"
              class="text-xs underline text-slate-500 hover:text-slate-900 dark:hover:text-white hover:cursor-pointer"
              @click="clearImage"
            >
              Clear
            </button>
          </div>
        </div>

        <div v-if="image" class="grid grid-cols-2 gap-3 items-center">
          <div>
            <label class="block mb-1 font-medium" for="qr-image-size">Image size: {{ Math.round(imageSize * 100) }}%</label>
            <input id="qr-image-size" v-model.number="imageSize" type="range" min="0.1" max="0.5" step="0.05" class="w-full">
          </div>
          <label class="inline-flex items-center gap-2 mt-5 font-medium">
            <input v-model="hideBgDots" type="checkbox" class="rounded">
            Hide dots behind image
          </label>
        </div>
      </form>

      <!-- Preview -->
      <div class="flex flex-col items-center gap-4">
        <div class="rounded-md border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50 max-w-full overflow-auto">
          <ClientOnly>
            <div ref="previewRef" class="flex items-center justify-center [&_canvas]:max-w-full [&_canvas]:h-auto" />
            <template #fallback>
              <div class="w-[300px] h-[300px] flex items-center justify-center text-slate-400">
                <Icon name="svg-spinners:180-ring" size="32" />
              </div>
            </template>
          </ClientOnly>
        </div>
        <button
          type="button"
          :disabled="!canDownload"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
          @click="download"
        >
          <Icon name="mdi:download" size="16" />
          Download PNG
        </button>
      </div>
    </div>

    <section class="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
        Create QR Codes Online
      </h2>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This free tool helps you generate QR codes for websites, text, contact cards, and marketing campaigns. Customize colors, dot styles, and corners to match your brand. You can also upload a center logo and download the final image as PNG.
      </p>

      <h2 class="mt-8 text-xl font-semibold text-slate-900 dark:text-slate-100">
        FAQ
      </h2>
      <dl class="mt-3 space-y-4 text-sm">
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            How to create a QR code online?
          </dt>
          <dd class="mt-1 text-slate-600 dark:text-slate-400">
            Enter your URL or text, adjust style settings, and click download.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Can I create a QR code with logo?
          </dt>
          <dd class="mt-1 text-slate-600 dark:text-slate-400">
            Yes. Upload a center image to place your logo in the code.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Is this QR code generator free to use?
          </dt>
          <dd class="mt-1 text-slate-600 dark:text-slate-400">
            Yes, it is fully free and works in your browser.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
