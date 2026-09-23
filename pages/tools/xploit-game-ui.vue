<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics'

definePageMeta({ layout: 'default' })

const TOOL_ID = 'xploit-game-ui'
const PUBLISHED = '2026-09-23'
const UPDATED = '2026-09-23'
const REPO_URL = 'https://github.com/Rovniy/xploit_game_ui'
// The UPM tarball is attached to each GitHub release. `/latest` always lands on
// the newest one, so this page never needs a rebuild when a version ships.
const RELEASES_URL = `${REPO_URL}/releases/latest`
const DOCS_URL = `${REPO_URL}/blob/main/docs/css-support.md`

const highlights = [
  {
    icon: 'mdi:language-html5',
    title: 'Write UI as a web page',
    text: 'Menus, HUDs, inventories and settings screens in plain HTML, CSS and JavaScript. Edit the CSS, reload, see the change — no recompile, no reclicking.',
  },
  {
    icon: 'mdi:chip',
    title: 'Not a browser',
    text: 'No Chromium, no second process. lexbor parses, V8 runs the script, Yoga lays out flexbox and Skia paints straight into a Unity texture on the game\'s own D3D12 device.',
  },
  {
    icon: 'mdi:speedometer',
    title: 'Free when nothing moves',
    text: 'A frame is produced only when something changed, and only the changed rectangle is redrawn. An idle menu drops from 22.7 ms per frame to zero.',
  },
]

const quickStart = [
  {
    name: 'Install the package',
    text: 'Download com.xploit.game_ui-<version>.tgz from the latest GitHub release, then in Unity: Window → Package Manager → + → Install package from tarball. The native runtime is prebuilt inside it.',
  },
  {
    name: 'Put your page under StreamingAssets',
    text: 'For example Assets/StreamingAssets/UI/HUD/index.html with its CSS and JS next to it. Nothing outside that root is reachable from the page.',
  },
  {
    name: 'Add the view',
    text: 'Put a RawImage on a Canvas, add an HtmlView component next to it and set its Path to UI/HUD/index.html. Add WebInput for mouse and keyboard.',
  },
  {
    name: 'Talk to it from C#',
    text: 'Four calls: Load, On, Send and RegisterFunction. The page answers with Unity.emit, Unity.on and Unity.call.',
  },
]

const faqItems = [
  {
    question: 'Is XPLOIT Game UI free?',
    answer: 'Yes. It is open source under the Apache-2.0 licence, and every bundled dependency is permissively licensed, so it can ship in a commercial game.',
  },
  {
    question: 'Which Unity versions and platforms does it support?',
    answer: 'Unity 6000.2 or newer on Windows 11 x64 with Direct3D 12. On any other graphics API it falls back to a CPU rasteriser, which works but costs more.',
  },
  {
    question: 'Does the page have network or file access?',
    answer: 'No. There is no fetch, XMLHttpRequest, WebSocket or dynamic import, and every path resolves inside the UI root. The only native surface the page can reach is the Unity object and the C# functions you register.',
  },
  {
    question: 'What CSS is missing?',
    answer: 'Grid, float, calc(), custom properties, @media, ::before/::after and :nth-child() are not supported yet, nor are table, select, canvas, video and iframe. The full support matrix is in the repository docs.',
  },
]

useToolPageSchema({
  path: '/tools/xploit-game-ui',
  title: 'XPLOIT Game UI — HTML, CSS & JavaScript UI for Unity',
  description: 'Open-source Unity plugin that renders game UI written in HTML, CSS and JavaScript on the GPU, in-process on Direct3D 12, and costs nothing when the UI is idle. Apache-2.0.',
  appName: 'XPLOIT Game UI',
  appCategory: 'DeveloperApplication',
  appDescription: 'A game UI runtime for Unity: write menus and HUDs as web pages, render them into a texture with Skia on the game\'s own D3D12 device.',
  appOperatingSystem: 'Windows 11 (Unity 6000.2+, Direct3D 12)',
  appDownloadUrl: RELEASES_URL,
  appIsFree: true,
  datePublished: PUBLISHED,
  dateModified: UPDATED,
  howTo: {
    name: 'How to add XPLOIT Game UI to a Unity project',
    description: 'Install the package from a tarball, put an HTML page under StreamingAssets and show it with an HtmlView component.',
    steps: quickStart,
  },
  faq: faqItems,
})

const { trackDownload } = useAnalytics()

function onDownload() {
  trackDownload(TOOL_ID, { file_type: 'tgz', variant: 'upm-package' })
}
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="flex items-start justify-between gap-x-6">
      <div class="min-w-0 flex-1 max-w-3xl">
        <span class="eyebrow">Unity · open-source plugin</span>
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          XPLOIT Game UI
        </h1>
        <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Build your game's UI with HTML, CSS and JavaScript, and render it on the GPU inside Unity.
          It is not an embedded browser: a small runtime paints the page straight into a texture,
          and costs nothing while nothing on screen moves.
        </p>
        <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow">
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Apache-2.0</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> No Chromium, no WebView SDK</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Prebuilt, nothing to compile</span>
        </p>
        <ToolStoryLink class="mt-3" />
      </div>
      <ToolRatingWidget />
    </header>

    <!-- Links -->
    <section class="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <a
          :href="RELEASES_URL"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-medium hover:opacity-90 transition"
          @click="onDownload"
        >
          <Icon name="mdi:unity" class="w-5 h-5" />
          Download the plugin
          <Icon name="mdi:open-in-new" class="w-4 h-4 opacity-60" />
        </a>
        <a
          :href="REPO_URL"
          class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium text-slate-700 dark:text-slate-200 hover:border-accent-500 transition"
        >
          <Icon name="fa:github" class="w-5 h-5" />
          Source on GitHub
        </a>
      </div>
      <p class="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        The plugin ships as a Unity package tarball (<code class="font-spacemono text-xs">.tgz</code>) attached to the latest GitHub release.
        Requires Unity 6000.2 or newer on Windows 11 x64, with the graphics API set to Direct3D 12.
      </p>
    </section>

    <!-- What it is -->
    <section class="mt-14">
      <span class="eyebrow">What it is</span>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="h in highlights"
          :key="h.title"
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <Icon :name="h.icon" class="w-5 h-5 text-accent-500" />
          <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            {{ h.title }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ h.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Quick start -->
    <section class="mt-14">
      <span class="eyebrow">Quick start</span>
      <ol class="mt-4 space-y-3">
        <li
          v-for="(s, i) in quickStart"
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
      <a :href="REPO_URL" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="fa:github" class="w-4 h-4" /> Rovniy/xploit_game_ui
      </a>
      <a :href="DOCS_URL" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="mdi:file-document-outline" class="w-4 h-4" /> HTML / CSS support matrix
      </a>
      <a :href="`${REPO_URL}/issues`" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="mdi:bug-outline" class="w-4 h-4" /> Report a bug
      </a>
    </section>
  </div>
</template>
