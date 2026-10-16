<script setup lang="ts">
import type TabsBroadcast from 'tabs-broadcast'
import { useAnalytics } from '~/composables/useAnalytics'
import { seoData } from '~/data'

// Live demo of the tabs-broadcast library: open the page in several tabs, emit
// from the primary one and watch every tab's counters move. Ported from the
// standalone demo that used to live on tabs-broadcast.ravy.pro.
//
// The library touches BroadcastChannel, Web Locks and localStorage, so it is
// imported in onMounted only — the page itself is prerendered.

definePageMeta({ layout: 'default' })

const TOOL_ID = 'tabs-broadcast'
const PATH = '/tools/tabs-broadcast/demo'
const TITLE = 'tabs-broadcast live demo'
const DESCRIPTION = 'Open this page in several browser tabs: the primary tab emits events, every tab counts them, and closing the primary hands its role to another tab.'
// Not the library default, so the demo can't collide with another app on this origin.
const CHANNEL = 'ravy_tabs_broadcast_demo'
const LAYER_1 = 'APP_LAYER_0'
const LAYER_2 = 'APP_LAYER_1'

useHead({
  title: TITLE,
  link: [{ rel: 'canonical', href: `${seoData.mySite}${PATH}` }],
  meta: [{ name: 'description', content: DESCRIPTION }],
})

useGenericPageSchema({
  url: `${seoData.mySite}${PATH}`,
  name: TITLE,
  description: DESCRIPTION,
  image: `${seoData.mySite}/og-image.webp`,
  parents: [
    { name: 'Tools', url: `${seoData.mySite}/tools` },
    { name: 'tabs-broadcast', url: `${seoData.mySite}/tools/tabs-broadcast` },
  ],
})

interface DemoEvents {
  INCREASE_BY_EVENT: null
  INCREASE_BY_EVENT_PAYLOAD: { increase: number }
  INCREASE_BY_LAYER: { increase: number }
}

const ready = ref(false)
const unsupported = ref(false)
const isPrimary = ref(false)
const counters = reactive({ main: 0, layer1: 0, layer2: 0 })
// Bumped on every change so the counter's :key re-mounts it and replays the pulse.
const pulses = reactive({ main: 0, layer1: 0, layer2: 0 })

let bus: TabsBroadcast<DemoEvents> | null = null
let disposed = false

const actions = [
  { id: 'simple', label: 'Simple event', chip: '+1', emit: (b: TabsBroadcast<DemoEvents>) => b.emit('INCREASE_BY_EVENT', null) },
  { id: 'payload', label: 'Event with payload', chip: '+5', emit: (b: TabsBroadcast<DemoEvents>) => b.emit('INCREASE_BY_EVENT_PAYLOAD', { increase: 5 }) },
  { id: 'all_layers', label: 'To both layers', chip: '+3', emit: (b: TabsBroadcast<DemoEvents>) => b.emit('INCREASE_BY_LAYER', { increase: 3 }, [LAYER_1, LAYER_2]) },
  { id: 'layer_1', label: 'To layer 1', chip: '+10', emit: (b: TabsBroadcast<DemoEvents>) => b.emit('INCREASE_BY_LAYER', { increase: 10 }, LAYER_1) },
  { id: 'layer_2', label: 'To layer 2', chip: '+10', emit: (b: TabsBroadcast<DemoEvents>) => b.emit('INCREASE_BY_LAYER', { increase: 10 }, LAYER_2) },
]

const counterCards = [
  { key: 'main', label: 'Counter', hint: 'Simple event and payload' },
  { key: 'layer1', label: 'Layer 1', hint: `Listens in ${LAYER_1}` },
  { key: 'layer2', label: 'Layer 2', hint: `Listens in ${LAYER_2}` },
] as const

function bump(key: keyof typeof counters, increase: number | undefined) {
  counters[key] += increase || 1
  pulses[key]++
}

const { trackTool } = useAnalytics()

function emit(action: typeof actions[number]) {
  if (!bus || !isPrimary.value)
    return
  action.emit(bus)
  trackTool(TOOL_ID, 'demo_emit', { event: action.id })
}

function openAnotherTab() {
  window.open(PATH, '_blank', 'noopener')
  trackTool(TOOL_ID, 'demo_open_tab')
}

onMounted(async () => {
  if (typeof BroadcastChannel === 'undefined') {
    unsupported.value = true
    return
  }
  const { default: TabsBroadcastCtor } = await import('tabs-broadcast')
  if (disposed)
    return

  bus = new TabsBroadcastCtor<DemoEvents>({
    channelName: CHANNEL,
    // Echo events back to the emitting tab so the primary's own counters move too.
    listenOwnChannel: true,
    onBecomePrimary: () => { isPrimary.value = true },
  })
  isPrimary.value = bus.primary

  bus.onList([
    ['INCREASE_BY_EVENT', () => bump('main', 1)],
    ['INCREASE_BY_EVENT_PAYLOAD', ({ payload }) => bump('main', payload?.increase)],
    ['INCREASE_BY_LAYER', ({ payload }) => bump('layer1', payload?.increase), LAYER_1],
    ['INCREASE_BY_LAYER', ({ payload }) => bump('layer2', payload?.increase), LAYER_2],
  ])
  ready.value = true
})

// The library is a singleton holding a Web Lock: release it on client-side
// navigation, or the next tab could not take over until this one is closed.
onBeforeUnmount(() => {
  disposed = true
  bus?.destroy()
  bus = null
})
</script>

<template>
  <div class="px-6 lg:px-10 py-8 sm:py-12 mx-auto w-full max-w-6xl">
    <NuxtLink to="/tools/tabs-broadcast" class="inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500">
      <Icon name="mdi:arrow-left" class="w-4 h-4" aria-hidden="true" /> tabs-broadcast
    </NuxtLink>

    <header class="mt-6">
      <span class="eyebrow">Live demo</span>
      <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
        Messages between your tabs
      </h1>
      <p class="mt-3 text-base sm:text-lg text-fg-muted leading-relaxed">
        Open this page in two or three tabs. The primary tab emits events and every tab counts them.
        Close or reload the primary tab and another one takes over.
      </p>
    </header>

    <div v-if="unsupported" class="mt-8 border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
      This browser has no BroadcastChannel API, so the demo can't run here. Try a current Chrome, Edge, Firefox or Safari 15.4+.
    </div>

    <template v-else>
      <!-- Status -->
      <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div
          class="inline-flex items-center gap-2.5 border px-4 py-2 text-sm font-medium"
          :class="isPrimary
            ? 'border-ok/40 bg-ok/10 text-ok'
            : 'border-line-strong bg-panel text-fg-muted'"
          role="status"
        >
          <span class="relative flex w-2.5 h-2.5" aria-hidden="true">
            <span v-if="isPrimary" class="absolute inline-flex w-full h-full rounded-full bg-ok opacity-75 motion-safe:animate-ping" />
            <span class="relative inline-flex w-2.5 h-2.5 rounded-full" :class="isPrimary ? 'bg-ok' : 'bg-panel-raised'" />
          </span>
          <span v-if="!ready">Connecting…</span>
          <span v-else-if="isPrimary">Primary tab — can emit events</span>
          <span v-else>Secondary tab — listening only</span>
        </div>
        <button
          type="button"
          class="skew-box btn btn-secondary btn-sm"
          @click="openAnotherTab"
        >
          <Icon name="mdi:tab-plus" class="w-4 h-4" aria-hidden="true" />
          Open another tab
        </button>
      </div>

      <!-- Emit -->
      <section class="mt-6 border border-line bg-panel p-5 sm:p-6">
        <span class="eyebrow">Emit events</span>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="(a, i) in actions"
            :key="a.id"
            type="button"
            :disabled="!ready || !isPrimary"
            class="flex items-center justify-between gap-3 border px-4 py-3 text-left font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
            :class="i === 0
              ? 'border-accent bg-accent text-accent-fg enabled:hover:brightness-105'
              : 'border-line-strong text-fg enabled:hover:border-accent'"
            @click="emit(a)"
          >
            <span>{{ a.label }}</span>
            <span
              class="shrink-0 px-2 py-0.5 font-spacemono text-xs"
              :class="i === 0 ? 'bg-accent-fg/15' : 'bg-panel-raised text-accent-500'"
            >{{ a.chip }}</span>
          </button>
        </div>
        <p class="mt-4 text-sm text-fg-muted">
          Only the primary tab can emit (<code class="font-spacemono text-xs">emitByPrimaryOnly</code> is on by default). Secondary tabs receive and count.
        </p>
      </section>

      <!-- Counters -->
      <section class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="c in counterCards"
          :key="c.key"
          class="border border-line bg-panel p-5"
        >
          <span class="eyebrow">{{ c.label }}</span>
          <div class="mt-2 h-12 overflow-hidden">
            <span
              :key="pulses[c.key]"
              class="block font-spacemono text-4xl font-bold text-fg tabular-nums"
              :class="pulses[c.key] ? 'counter-pulse' : ''"
              aria-live="polite"
            >{{ counters[c.key] }}</span>
          </div>
          <p class="mt-1 text-xs text-fg-muted">
            {{ c.hint }}
          </p>
        </div>
      </section>
    </template>

    <p class="mt-10 text-sm text-fg-muted">
      Install it with <code class="font-spacemono text-xs">npm install tabs-broadcast</code>.
      The <NuxtLink to="/tools/tabs-broadcast" class="text-accent-500 hover:underline">
        library page
      </NuxtLink> has the quick start, and the
      <a href="https://github.com/Rovniy/tabs-broadcast" class="text-accent-500 hover:underline">source is on GitHub</a>.
    </p>
  </div>
</template>

<style scoped>
.counter-pulse {
  transform-origin: left center;
  animation: counter-pulse 0.45s ease-out;
}

@keyframes counter-pulse {
  0% { transform: scale(1.25); color: var(--color-accent-500); }
  100% { transform: scale(1); }
}

@media (prefers-reduced-motion: reduce) {
  .counter-pulse { animation: none; }
}
</style>
