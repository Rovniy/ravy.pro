<script setup lang="ts">
import type { LatestRelease, ReleaseAsset } from '~/utils/github-release'
import { computed } from 'vue'
import { useAnalytics } from '~/composables/useAnalytics'
import { TRANSLATOR_RELEASES_URL, TRANSLATOR_REPO_URL } from '~/utils/github-release'
import { formatBytes } from '~/utils/image-convert'

definePageMeta({ layout: 'default' })

const TOOL_ID = 'xploit-translator'
const PUBLISHED = '2026-08-07'
const UPDATED = '2026-08-07'
const ISSUES_URL = `${TRANSLATOR_REPO_URL}/issues`

const steps = [
  {
    icon: 'mdi:content-copy',
    title: 'Copy anything',
    text: 'A sentence, a whole page, or a screenshot — the clipboard decides which of the two it hands over, so a copied picture stays a picture.',
  },
  {
    icon: 'mdi:keyboard-outline',
    title: 'Press Ctrl + Alt + T',
    text: 'A small window rises from the left edge of the screen above the taskbar, on whichever monitor your cursor is on.',
  },
  {
    icon: 'mdi:text-recognition',
    title: 'Read the translation',
    text: 'It streams in word by word. Press Esc or click anywhere else and the window is gone, along with what it held.',
  },
]

const features = [
  {
    icon: 'mdi:image-text',
    title: 'Screenshots, not just text',
    text: 'Copy a screenshot, a photo of a menu, or a dialog box you cannot read. A vision model reads the text off the image and translates it — there is no separate OCR step to configure.',
  },
  {
    icon: 'mdi:translate',
    title: 'Source language detected for you',
    text: 'You only ever pick the target. English, Tiếng Việt, 中文 and Русский are the four available today, switchable from the tray.',
  },
  {
    icon: 'mdi:keyboard-settings-outline',
    title: 'Two rebindable hotkeys',
    text: 'Ctrl + Alt + T translates the clipboard, Ctrl + Alt + N opens a blank window for typing by hand. If a combination is already taken, the app says so and keeps the working one.',
  },
  {
    icon: 'mdi:cursor-text',
    title: 'Optional: translate the selection',
    text: 'Off by default. When on, the hotkey picks up whatever is selected in the active window so you skip Ctrl + C — at the cost of replacing your clipboard.',
  },
  {
    icon: 'mdi:flash-outline',
    title: 'Repeats are free',
    text: 'The last 200 translations are cached in memory, keyed by model and target language, so pasting the same thing twice costs nothing and answers instantly.',
  },
  {
    icon: 'mdi:power-plug-outline',
    title: 'Stays out of the way',
    text: 'Lives in the tray, starts with Windows, and never appears in Alt+Tab or on the taskbar. Losing focus hides it and drops the session.',
  },
]

const installSteps = [
  {
    name: 'Download and run the installer',
    text: 'It installs into your user profile — no administrator rights. The build is not code-signed, so on the first launch Windows SmartScreen shows a warning: choose "More info", then "Run anyway".',
  },
  {
    name: 'Paste an OpenAI API key',
    text: 'On a first start without a key the settings window opens by itself. Paste your key once; it is stored in the Windows Credential Manager and the app never asks again.',
  },
  {
    name: 'Copy something and press Ctrl + Alt + T',
    text: 'The overlay appears with the clipboard already translating. Pick your target language and model in the settings from the tray icon.',
  },
]

const models = [
  { name: 'gpt-5-nano', price: '0.05 · 0.40', when: 'Cheapest. Fine for ordinary text.' },
  { name: 'gpt-5.6-luna', price: '0.20 · 1.20', when: 'The default — fast and accurate.' },
  { name: 'gpt-5.6-terra', price: '2.00 · 12.00', when: 'Rare languages and heavy terminology.' },
]

const settingsRows = [
  { setting: 'Clipboard hotkey', value: 'Ctrl + Alt + T', note: 'Rebindable. Must include at least one modifier — a bare key would be swallowed Windows-wide.' },
  { setting: 'Blank-window hotkey', value: 'Ctrl + Alt + N', note: 'Rebindable, same rule.' },
  { setting: 'Target language', value: 'English · Tiếng Việt · 中文 · Русский', note: 'Applied to the next translation. The tray tooltip always shows the current one.' },
  { setting: 'Model', value: 'gpt-5-nano · gpt-5.6-luna · gpt-5.6-terra', note: 'Defaults to gpt-5.6-luna.' },
  { setting: 'Translate the selection', value: 'Off', note: 'Replaces your clipboard, interrupts console programs that read Ctrl + C, and silently does nothing against an elevated window.' },
  { setting: 'Start with Windows', value: 'On', note: 'Reconciled with the OS entry at every launch, so disabling it from Task Manager sticks.' },
]

const faqItems = [
  {
    question: 'Do I need an OpenAI API key?',
    answer: 'Yes. The app itself is free and there is no account to create, but translation runs on your own OpenAI key, which you paste once on the first launch. Nothing is billed through this site.',
  },
  {
    question: 'How much does it cost to run?',
    answer: 'You pay OpenAI for tokens and nothing else. On the default model that is $0.20 per million input tokens and $1.20 per million output tokens, so ordinary day-to-day use costs cents. Prices are OpenAI\'s and can change.',
  },
  {
    question: 'Why does Windows warn me the first time I run it?',
    answer: 'The builds are not code-signed, so SmartScreen shows its "unrecognised app" warning. Choose "More info", then "Run anyway". Every release also ships a SHA256SUMS.txt you can check the download against.',
  },
  {
    question: 'Does it translate text on screenshots?',
    answer: 'Yes. Copy an image instead of text and the model reads the text off it and translates that. The full-size picture stays in the app\'s Rust layer and is sent only to OpenAI as part of the request.',
  },
  {
    question: 'Where is my API key stored?',
    answer: 'In the Windows Credential Manager, under xploit-translator/openai_api_key. It is never written to a config file and never handed to the app\'s own web layer, which has no HTTP or clipboard permission at all.',
  },
  {
    question: 'Does it work offline?',
    answer: 'No. Translation is an OpenAI API call, so the machine needs a connection. Repeated input is served from an in-memory cache, which does survive a brief drop but not a restart.',
  },
  {
    question: 'Which languages can it translate into?',
    answer: 'English, Tiếng Việt, 中文 and Русский. The source language is always detected automatically, so you only choose the target.',
  },
  {
    question: 'Does it update itself?',
    answer: 'Not yet — there is no auto-updater. New versions are published on the GitHub releases page; download the installer again to upgrade in place.',
  },
]

const { data: releaseData, status } = useFetch<{
  ok: boolean
  release: LatestRelease | null
  stale?: boolean
}>('/api/xploit-translator/release', {
  // Deliberately client-only: this page is prerendered, so an SSR fetch would
  // freeze whatever version was current at build time into the static HTML.
  // Crawlers and no-JS visitors get the plain "latest release" links below.
  server: false,
  lazy: true,
  key: 'xploit-translator-release',
})

const release = computed(() => (releaseData.value?.ok ? releaseData.value.release : null))
const loading = computed(() => status.value === 'pending')
const installer = computed(() => release.value?.installer ?? null)
const portable = computed(() => release.value?.portable ?? null)
const checksums = computed(() => release.value?.checksums ?? null)

const publishedLabel = computed(() => {
  const iso = release.value?.publishedAt
  if (!iso)
    return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
})

useToolPageSchema({
  path: '/tools/xploit-translator',
  title: 'XPLOIT Translator — clipboard & screenshot translator for Windows',
  description: 'Free Windows tray app that translates the clipboard — text or a screenshot — in an overlay above the taskbar on Ctrl+Alt+T. Source language detected automatically, translation streamed in, your own OpenAI key.',
  appName: 'XPLOIT Translator',
  appCategory: 'UtilitiesApplication',
  appDescription: 'A resident Windows tray widget that translates copied text and screenshots in an overlay, using your own OpenAI API key.',
  appOperatingSystem: 'Windows 10, Windows 11',
  appDownloadUrl: `${TRANSLATOR_RELEASES_URL}/latest`,
  appSoftwareVersion: () => release.value?.version,
  appIsFree: true,
  datePublished: PUBLISHED,
  dateModified: UPDATED,
  howTo: {
    name: 'How to install XPLOIT Translator on Windows',
    description: 'Download the installer, paste an OpenAI API key once, then translate anything you copy with a hotkey.',
    steps: installSteps,
  },
  faq: faqItems,
})

const { trackDownload } = useAnalytics()

function onDownload(asset: ReleaseAsset, variant: 'installer' | 'portable') {
  trackDownload(TOOL_ID, {
    file_name: asset.name,
    file_type: 'exe',
    variant,
    version: release.value?.version,
  })
}
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="flex items-start justify-between gap-x-6">
      <div class="min-w-0 max-w-3xl">
        <span class="eyebrow">Windows · desktop app</span>
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          XPLOIT Translator
        </h1>
        <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Copy a sentence or a screenshot anywhere in Windows, press <kbd class="font-spacemono text-sm">Ctrl&nbsp;+&nbsp;Alt&nbsp;+&nbsp;T</kbd>,
          and a small window rises above the taskbar with the translation. No tab to open, nothing to paste,
          nothing to close.
        </p>
        <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow">
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Free app, no account</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Your own OpenAI key</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Key stays in Windows Credential Manager</span>
        </p>
      </div>
      <ToolRatingWidget />
    </header>

    <!-- Download -->
    <section class="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="eyebrow">Latest release</span>
        <span v-if="release" class="font-spacemono text-sm text-accent-500">v{{ release.version }}</span>
        <!-- ClientOnly, not a plain v-else-if: the fetch is client-only, so on the
             first client render `loading` is already true while the prerendered
             HTML has nothing here — that is a hydration mismatch. -->
        <ClientOnly v-else>
          <span v-if="loading" class="h-4 w-14 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" aria-hidden="true" />
        </ClientOnly>
        <span v-if="publishedLabel" class="text-xs text-slate-400">· {{ publishedLabel }}</span>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <template v-if="installer">
          <a
            :href="installer.url"
            class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-medium hover:opacity-90 transition"
            @click="onDownload(installer, 'installer')"
          >
            <Icon name="mdi:microsoft-windows" class="w-5 h-5" />
            Download for Windows
            <span v-if="installer.size" class="opacity-60 text-sm">{{ formatBytes(installer.size) }}</span>
          </a>
          <a
            v-if="portable"
            :href="portable.url"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium text-slate-700 dark:text-slate-200 hover:border-accent-500 transition"
            @click="onDownload(portable, 'portable')"
          >
            <Icon name="mdi:folder-zip-outline" class="w-5 h-5" />
            Portable .exe
            <span v-if="portable.size" class="opacity-60 text-sm">{{ formatBytes(portable.size) }}</span>
          </a>
        </template>
        <a
          v-else
          :href="`${TRANSLATOR_RELEASES_URL}/latest`"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-medium hover:opacity-90 transition"
        >
          <Icon name="mdi:microsoft-windows" class="w-5 h-5" />
          Download for Windows
          <Icon name="mdi:open-in-new" class="w-4 h-4 opacity-60" />
        </a>
      </div>

      <p class="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Windows 10 or 11, 64-bit. Needs the WebView2 Runtime, which is already part of Windows 11.
        The installer writes into your user profile, so no administrator rights are required; the portable
        build is a single file that runs from anywhere.
      </p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        Neither build is code-signed, so SmartScreen warns on the first launch — choose
        <strong class="font-medium text-slate-700 dark:text-slate-200">More info → Run anyway</strong>.
        Every release ships a checksum file if you would rather verify the download first.
      </p>

      <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <a
          v-if="checksums"
          :href="checksums.url"
          class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-accent-500 transition-colors"
        >
          <Icon name="mdi:file-check-outline" class="w-4 h-4" /> SHA256SUMS.txt
        </a>
        <a :href="TRANSLATOR_RELEASES_URL" class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-accent-500 transition-colors">
          <Icon name="mdi:history" class="w-4 h-4" /> All releases
        </a>
        <a :href="TRANSLATOR_REPO_URL" class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-accent-500 transition-colors">
          <Icon name="fa:github" class="w-4 h-4" /> Source on GitHub
        </a>
      </div>
    </section>

    <section class="mt-14">
      <span class="eyebrow">Workshop</span>
      <div class="mt-4">
        <!-- No width/height attributes: a fixed pixel width overflows the
             viewport on phones. The 16:9 box scales with the column instead. -->
        <iframe
          class="block w-full aspect-video rounded-xl border-0"
          src="https://www.youtube.com/embed/YXh629Osrf8?si=gIaL6Q-S3VO94i0F"
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        />
      </div>
    </section>

    <!-- How it works -->
    <section class="mt-14">
      <span class="eyebrow">How it works</span>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="(s, i) in steps"
          :key="s.title"
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div class="flex items-center gap-2">
            <span class="font-spacemono text-xs text-accent-500">0{{ i + 1 }}</span>
            <Icon :name="s.icon" class="w-5 h-5 text-accent-500" />
          </div>
          <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            {{ s.title }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ s.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="mt-14">
      <span class="eyebrow">What it does</span>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="f in features"
          :key="f.title"
          class="rounded-xl border border-slate-200 dark:border-slate-800 p-5"
        >
          <div class="flex items-center gap-2">
            <Icon :name="f.icon" class="w-5 h-5 text-accent-500" />
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">
              {{ f.title }}
            </h3>
          </div>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ f.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Install -->
    <section class="mt-14">
      <span class="eyebrow">Installing it</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Three steps, once
      </h2>
      <ol class="mt-5 space-y-4">
        <li
          v-for="(s, i) in installSteps"
          :key="s.name"
          class="flex gap-4 rounded-xl border border-slate-200 dark:border-slate-800 p-5"
        >
          <span class="font-spacemono text-sm text-accent-500 shrink-0">0{{ i + 1 }}</span>
          <div class="min-w-0">
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">
              {{ s.name }}
            </h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {{ s.text }}
            </p>
          </div>
        </li>
      </ol>
    </section>

    <!-- Cost -->
    <section class="mt-14">
      <span class="eyebrow">What it costs</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        The app is free — you pay OpenAI for tokens
      </h2>
      <p class="mt-3 max-w-3xl text-slate-600 dark:text-slate-300 leading-relaxed">
        There is no subscription, no licence and no account here. The app talks to OpenAI with the key you
        paste on the first run, so translation is billed to you directly, at OpenAI's rates. Pick the model in
        the settings; the cheapest one handles ordinary text perfectly well.
      </p>
      <div class="mt-5 overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                Model
              </th>
              <th class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                $ / 1M tokens (in · out)
              </th>
              <th class="py-2 font-semibold text-slate-900 dark:text-slate-100">
                When to use it
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in models" :key="m.name" class="border-b border-slate-100 dark:border-slate-900">
              <td class="py-2 pr-4 font-spacemono text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {{ m.name }}
              </td>
              <td class="py-2 pr-4 font-spacemono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {{ m.price }}
              </td>
              <td class="py-2 text-slate-500 dark:text-slate-400">
                {{ m.when }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-sm text-slate-400">
        Rates are OpenAI's and can change — check their pricing page for the current figures.
      </p>
    </section>

    <!-- Privacy -->
    <section class="mt-14">
      <span class="eyebrow">Where your data goes</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        The key never leaves the Rust side
      </h2>
      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <Icon name="mdi:shield-key-outline" class="shrink-0 mt-0.5 w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span>Your API key lives in the <strong class="font-medium">Windows Credential Manager</strong>, not in a config file. The app's web layer is granted no HTTP, clipboard or keyring permission at all — it only ever learns whether a key exists.</span>
        </div>
        <div class="flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <Icon name="mdi:cloud-upload-outline" class="shrink-0 mt-0.5 w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span>Clipboard content leaves your machine only when you trigger a translation, and only to OpenAI. Nothing is sent anywhere else, and this website is not involved once the app is installed.</span>
        </div>
        <div class="flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <Icon name="mdi:database-off-outline" class="shrink-0 mt-0.5 w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span>No history is kept. The 200-entry cache is in memory and gone when you quit; hiding the window drops the session and whatever it was showing.</span>
        </div>
        <div class="flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <Icon name="mdi:eye-off-outline" class="shrink-0 mt-0.5 w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span>No telemetry, no analytics, no account. The whole source is on GitHub if you would rather read it than take my word for it.</span>
        </div>
      </div>
    </section>

    <!-- Settings reference -->
    <section class="mt-14">
      <span class="eyebrow">Settings</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Everything you can change
      </h2>
      <div class="mt-5 overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left border-b border-slate-200 dark:border-slate-800">
              <th class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                Setting
              </th>
              <th class="py-2 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                Default
              </th>
              <th class="py-2 font-semibold text-slate-900 dark:text-slate-100">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in settingsRows" :key="row.setting" class="border-b border-slate-100 dark:border-slate-900 align-top">
              <td class="py-2 pr-4 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                {{ row.setting }}
              </td>
              <td class="py-2 pr-4 font-spacemono text-slate-500 dark:text-slate-400">
                {{ row.value }}
              </td>
              <td class="py-2 text-slate-500 dark:text-slate-400 leading-relaxed">
                {{ row.note }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Why a hotkey overlay instead of a browser tab
      </h2>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Translating something on a web page costs five actions: copy, switch windows, find the tab, paste,
        read, switch back. Each one is small and all of them together are why people stop bothering and guess
        at the meaning instead. A resident widget collapses that into one keystroke, and because the window
        hides the moment it loses focus, there is no sixth action to close it.
      </p>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Windows 11 has no supported way to embed a control in the taskbar — the Windows 10 toolbars and
        deskbands are gone with no public replacement. So the window is positioned from the working area of
        whichever monitor your cursor is on, which puts it just above the taskbar and gets multi-monitor and
        per-monitor DPI right without any configuration.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Translating what you cannot select
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        A lot of the text you actually need translated cannot be copied: an error dialog, a game menu, a
        restaurant board in a photo, a scan someone sent you. Copying a picture to the clipboard and pressing
        the same hotkey sends the image itself, and the model reads the text off it and translates that —
        no OCR to install, no accuracy cliff on stylised fonts. What the app translates is decided by the
        clipboard: whichever format the copying application offered first wins, so copying a screenshot gives
        you the screenshot and copying a sentence gives you the sentence.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Why you bring your own API key
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        A middleman relay would mean a subscription, an account, and your clipboard passing through someone
        else's server. Pointing the app at your own OpenAI key removes all three: the request goes from your
        machine to OpenAI and back, you see exactly what you spend, and there is no service that can go
        away and take the app with it.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What it is not
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        It is an early build — version numbers still start with a zero. There is no auto-updater, no
        translation history, no offline mode, and four target languages rather than forty. It is 64-bit
        Windows only, and the binaries are unsigned. If any of that is a dealbreaker, this is the wrong tool
        and you should not download it.
      </p>

      <p class="mt-6 text-sm text-slate-400">
        Source is published on GitHub. No licence has been attached yet, so the usual defaults apply — ask
        before reusing the code.
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

    <!-- Footer strip -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
      <a :href="TRANSLATOR_REPO_URL" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="fa:github" class="w-4 h-4" /> Rovniy/windows-translater
      </a>
      <a :href="ISSUES_URL" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="mdi:bug-outline" class="w-4 h-4" /> Report a bug or ask for a language
      </a>
    </section>
  </div>
</template>
