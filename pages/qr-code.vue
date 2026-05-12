<script setup lang="ts">
import type QRCodeStyling from 'qr-code-styling'
import { useDebounceFn } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'QR-code',
  meta: [
    { name: 'description', content: 'Internal admin tool for generating styled QR codes.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const { state, isAuthed, isAdmin, signIn, signOut } = useAuth()

type DotType = 'square' | 'rounded' | 'dots' | 'classy' | 'classy-rounded' | 'extra-rounded'
type CornerSquareType = 'square' | 'dot' | 'extra-rounded'
type CornerDotType = 'square' | 'dot'

const data = ref('https://ravy.pro')
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
const signInError = ref('')

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

async function onSignIn() {
  signInError.value = ''
  try {
    await signIn()
  }
  catch (e: unknown) {
    signInError.value = e instanceof Error ? e.message : 'Sign-in failed'
  }
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        QR-code
      </h1>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        Generate a styled QR code, optionally with a center image, and download as PNG.
      </p>
    </header>

    <div v-if="!state.ready" class="text-zinc-500">
      Loading…
    </div>

    <div v-else-if="!isAuthed" class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50">
      <h2 class="text-lg font-semibold mb-2">
        Sign in required
      </h2>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        This area is restricted. Use the <strong>Sign in</strong> button in the top-right of the header, or click below.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
        @click="onSignIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
      <p v-if="signInError" class="mt-3 text-sm text-red-600 dark:text-red-400">
        {{ signInError }}
      </p>
    </div>

    <div v-else-if="!isAdmin" class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
      <h2 class="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">
        Access denied
      </h2>
      <p class="text-sm text-red-700/80 dark:text-red-300/80 mb-4">
        Your account <strong>{{ state.user?.email }}</strong> is not authorized to use this service.
      </p>
      <button type="button" class="text-sm underline hover:cursor-pointer" @click="signOut">
        Sign out
      </button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Form -->
      <form class="space-y-4 text-sm" @submit.prevent>
        <div>
          <label class="block mb-1 font-medium" for="qr-data">Data</label>
          <textarea
            id="qr-data"
            v-model="data"
            rows="3"
            placeholder="https://ravy.pro"
            class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
            <select id="qr-dot" v-model="dotStyle" class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
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
            <select id="qr-corner-sq" v-model="cornerSquareStyle" class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
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
            <select id="qr-corner-dot" v-model="cornerDotStyle" class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2">
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
            <input id="qr-fg" v-model="fgColor" type="color" class="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer">
          </div>
          <div>
            <label class="block mb-1 font-medium" for="qr-bg">Background</label>
            <input id="qr-bg" v-model="bgColor" type="color" class="w-full h-10 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer">
          </div>
        </div>

        <div>
          <label class="block mb-1 font-medium" for="qr-image-input">Center image (optional)</label>
          <div class="flex items-center gap-2">
            <input
              id="qr-image-input"
              type="file"
              accept="image/*"
              class="flex-1 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-900 dark:file:bg-white file:text-white dark:file:text-zinc-900 file:px-3 file:py-1.5 file:hover:opacity-90 file:cursor-pointer"
              @change="onImagePick"
            >
            <button
              v-if="image"
              type="button"
              class="text-xs underline text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:cursor-pointer"
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
        <div class="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50 max-w-full overflow-auto">
          <ClientOnly>
            <div ref="previewRef" class="flex items-center justify-center [&_canvas]:max-w-full [&_canvas]:h-auto" />
            <template #fallback>
              <div class="w-[300px] h-[300px] flex items-center justify-center text-zinc-400">
                <Icon name="svg-spinners:180-ring" size="32" />
              </div>
            </template>
          </ClientOnly>
        </div>
        <button
          type="button"
          :disabled="!canDownload"
          class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
          @click="download"
        >
          <Icon name="mdi:download" size="16" />
          Download PNG
        </button>
      </div>
    </div>
  </div>
</template>
