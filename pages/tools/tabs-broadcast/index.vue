<script setup lang="ts">
import { useAnalytics } from '~/composables/useAnalytics'
import { EVENTS } from '~/data/analytics'

definePageMeta({ layout: 'default' })

const TOOL_ID = 'tabs-broadcast'
const PUBLISHED = '2026-10-15'
const UPDATED = '2026-10-15'
const REPO_URL = 'https://github.com/Rovniy/tabs-broadcast'
const NPM_URL = 'https://www.npmjs.com/package/tabs-broadcast'
const NUXT_MODULE_URL = `${REPO_URL}/tree/master/packages/nuxt`
const DEMO_PATH = '/tools/tabs-broadcast/demo'
const VIDEO_ID = '6xeUvPN3dsQ'
const INSTALL_COMMAND = 'npm install tabs-broadcast'

const QUICK_START_CODE = `import TabsBroadcast from 'tabs-broadcast'

const bus = new TabsBroadcast()

// Subscribe in every tab
bus.on('cart:update', ({ payload }) => {
  console.log('cart changed:', payload)
})

// Publish: only the primary tab emits by default
if (bus.primary)
  bus.emit('cart:update', { items: 3 })`

const highlights = [
  {
    icon: 'mdi:tab',
    title: 'Messages between tabs',
    text: 'Publish an event in one tab and every other open tab of the same site receives it, over the browser\'s BroadcastChannel API. No server, no polling.',
  },
  {
    icon: 'mdi:crown-outline',
    title: 'One primary tab',
    text: 'Exactly one tab is elected primary through the Web Locks API, with a localStorage fallback. Close it and another tab takes over, so syncing or polling runs once, not per tab.',
  },
  {
    icon: 'mdi:layers-outline',
    title: 'Typed events and layers',
    text: 'Pass an event map as a generic for autocomplete and payload checks. Layers split one channel into independent streams, which suits micro-frontends.',
  },
]

const quickStart = [
  {
    name: 'Install the package',
    text: 'npm install tabs-broadcast (or pnpm, yarn, bun). For Nuxt 3 or 4, install the tabs-broadcast-nuxt module instead: it adds a client plugin and a useTabsBroadcast() composable.',
  },
  {
    name: 'Create the bus',
    text: 'new TabsBroadcast() in your app. It is a singleton: creating it again returns the same instance, and destroy() tears it down.',
  },
  {
    name: 'Subscribe in every tab',
    text: 'bus.on(type, callback) registers a listener. once() fires a single time, onList() registers many, and the "*" wildcard catches every event in a layer.',
  },
  {
    name: 'Emit from the primary tab',
    text: 'bus.emit(type, payload) sends to all tabs. By default only the primary tab may emit, so check bus.primary first or set emitByPrimaryOnly to false.',
  },
]

const faqItems = [
  {
    question: 'Is tabs-broadcast free?',
    answer: 'Yes. It is open source under the MIT licence, has zero dependencies and ships ESM and UMD builds with TypeScript types.',
  },
  {
    question: 'Which browsers does it support?',
    answer: 'Every modern browser with BroadcastChannel: Chrome, Edge, Firefox and Safari 15.4 or newer. It is safe to import during SSR: without a window it does nothing.',
  },
  {
    question: 'Why elect a primary tab?',
    answer: 'So that work which must not run in duplicate, such as server sync, background polling or notifications, runs in one tab only. When that tab closes or reloads, another one is promoted automatically.',
  },
  {
    question: 'Is the channel private?',
    answer: 'No. BroadcastChannel is same-origin, but any script on that origin can post to it if it knows the name. Treat every payload as untrusted input and use a hard-to-guess channelName.',
  },
]

useToolPageSchema({
  path: '/tools/tabs-broadcast',
  title: 'tabs-broadcast — messaging between browser tabs in JavaScript',
  description: 'Tiny zero-dependency TypeScript library for messaging between browser tabs over BroadcastChannel, with primary-tab election via Web Locks. MIT.',
  appName: 'tabs-broadcast',
  appCategory: 'DeveloperApplication',
  appDescription: 'An npm library for inter-tab communication: typed events and layers over the BroadcastChannel API, plus primary-tab (leader) election via Web Locks.',
  appOperatingSystem: 'Any modern browser (BroadcastChannel)',
  appDownloadUrl: NPM_URL,
  appIsFree: true,
  datePublished: PUBLISHED,
  dateModified: UPDATED,
  howTo: {
    name: 'How to send messages between browser tabs with tabs-broadcast',
    description: 'Install the npm package, create the bus, subscribe in every tab and emit from the primary one.',
    steps: quickStart,
  },
  faq: faqItems,
})

const { trackTool } = useAnalytics()
const copied = ref(false)

function copyInstall() {
  navigator.clipboard.writeText(INSTALL_COMMAND).then(() => {
    copied.value = true
    trackTool(TOOL_ID, 'copy_install')
    setTimeout(() => (copied.value = false), 1500)
  }).catch(() => {})
}
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="flex flex-col gap-y-4 sm:flex-row sm:items-start sm:justify-between gap-x-6">
      <div class="min-w-0 flex-1 max-w-3xl">
        <span class="eyebrow">JavaScript · open-source library</span>
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          tabs-broadcast
        </h1>
        <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Send events between the open tabs of your web app, and let exactly one of them do the work
          that must not run twice. A tiny TypeScript library over the BroadcastChannel API.
        </p>
        <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow">
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> MIT</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Zero dependencies</span>
          <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> TypeScript, Nuxt module</span>
        </p>
        <ToolStoryLink class="mt-3" />
      </div>
      <ToolRatingWidget />
    </header>

    <!-- Links -->
    <section class="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 font-spacemono text-sm hover:opacity-90 transition"
          :aria-label="`Copy: ${INSTALL_COMMAND}`"
          @click="copyInstall"
        >
          <span class="opacity-60">$</span>
          {{ INSTALL_COMMAND }}
          <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4 opacity-70" />
        </button>
        <NuxtLink
          :to="DEMO_PATH"
          class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium text-slate-700 dark:text-slate-200 hover:border-accent-500 transition"
        >
          <Icon name="mdi:play-circle-outline" class="w-5 h-5" />
          Live demo
        </NuxtLink>
        <a
          :href="NPM_URL"
          class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-5 py-3 font-medium text-slate-700 dark:text-slate-200 hover:border-accent-500 transition"
        >
          <Icon name="mdi:npm" class="w-5 h-5" />
          npm
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
        Open the demo in two or three tabs to see messages travel between them and the primary tab move when you close it.
        Using Nuxt? Install <a :href="NUXT_MODULE_URL" class="text-accent-500 hover:underline"><code class="font-spacemono text-xs">tabs-broadcast-nuxt</code></a> instead.
      </p>
    </section>

    <!-- Video -->
    <section class="mt-14">
      <span class="eyebrow">Video</span>
      <div class="mt-4">
        <UiEmbedFacade
          :src="`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`"
          title="tabs-broadcast: messaging between browser tabs in JavaScript"
          :poster="`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`"
          poster-alt="tabs-broadcast video thumbnail"
          :event="EVENTS.VIDEO_PLAY"
          :event-params="{ tool_id: TOOL_ID, item: 'overview' }"
        />
      </div>
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
      <div class="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950">
        <pre class="p-5 font-spacemono text-xs sm:text-sm leading-relaxed text-slate-200"><code>{{ QUICK_START_CODE }}</code></pre>
      </div>
    </section>

    <ProjectRelatedPosts tag="tabs-broadcast" title="Writing about it" :limit="6" />

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
        <Icon name="fa:github" class="w-4 h-4" /> Rovniy/tabs-broadcast
      </a>
      <a :href="`${REPO_URL}#api`" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="mdi:file-document-outline" class="w-4 h-4" /> API reference
      </a>
      <a :href="`${REPO_URL}/issues`" class="inline-flex items-center gap-1.5 hover:text-accent-500 transition-colors">
        <Icon name="mdi:bug-outline" class="w-4 h-4" /> Report a bug
      </a>
    </section>
  </div>
</template>
