<script setup lang="ts">
import type { ScopeId } from '~/utils/command-index'
import type { CommandAction, CommandItem, SearchHit } from '~/utils/command-search'
import { baseData } from '~/data'
import { EVENTS } from '~/data/analytics'
import { postItems, RUN, SCOPES, staticCommandItems, TYPE_LABEL } from '~/utils/command-index'
import { highlightParts, searchCommands } from '~/utils/command-search'

// The ⌘K palette. A WAI-ARIA combobox: focus never leaves the input, the
// active row is announced through aria-activedescendant, and every row has up
// to three actions — Enter runs the first, ⌘/Ctrl+Enter the second, and all of
// them are buttons on the highlighted row. Mounted on first open only (see
// useCommandPalette), inside a native <dialog> so the page behind is inert.

const { isOpen, initialQuery, close } = useCommandPalette()
const { track } = useAnalytics()
const modKey = useModKey()
const route = useRoute()
const colorMode = useColorMode()

const dialogRef = ref<HTMLDialogElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const query = ref('')
const scope = ref<ScopeId>('all')
const active = ref(0)
/** `item.id|action.label` of the copy that just succeeded, for the inline ✓. */
const copiedKey = ref<string | null>(null)
const actionKey = (item: CommandItem, action: CommandAction) => `${item.id}|${action.label}`
/** Thumbnails that failed to load fall back to the item's icon. */
const brokenImages = ref(new Set<string>())
const status = ref('')

// --- Index ------------------------------------------------------------------

const staticItems = staticCommandItems()
const posts = ref<CommandItem[]>([])
const postsState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

async function loadPosts() {
  if (postsState.value === 'loading' || postsState.value === 'ready')
    return
  postsState.value = 'loading'
  try {
    posts.value = postItems(await $fetch<Parameters<typeof postItems>[0]>('/api/blog/posts'))
    postsState.value = 'ready'
  }
  catch {
    // The rest of the palette works without posts; the Posts chip says why.
    postsState.value = 'error'
  }
}

const allItems = computed(() => [...staticItems, ...posts.value])

// --- Recents ----------------------------------------------------------------

const RECENT_KEY = 'cmdk:recent'
const recentIds = ref<string[]>([])

function readRecents() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    recentIds.value = Array.isArray(raw) ? raw.filter(x => typeof x === 'string').slice(0, 5) : []
  }
  catch {
    recentIds.value = []
  }
}

function remember(item: CommandItem) {
  recentIds.value = [item.id, ...recentIds.value.filter(id => id !== item.id)].slice(0, 5)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds.value))
  }
  catch {}
}

// --- Results ----------------------------------------------------------------

interface Section { key: string, label: string, hits: SearchHit[] }

/** A leading ">" means "commands only", as in VS Code. */
const effective = computed(() => {
  const q = query.value
  if (q.trimStart().startsWith('>'))
    return { text: q.trimStart().slice(1), scope: 'actions' as ScopeId }
  return { text: q, scope: scope.value }
})

const scopedItems = computed(() => {
  const types = SCOPES.find(s => s.id === effective.value.scope)?.types
  return types ? allItems.value.filter(i => (types as readonly string[]).includes(i.type)) : allItems.value
})

const search = computed(() => searchCommands(scopedItems.value, effective.value.text, 50))

const TYPE_ORDER = Object.keys(TYPE_LABEL) as Array<CommandItem['type']>

const sections = computed<Section[]>(() => {
  const hits = search.value.hits
  const typed = effective.value.text.trim().length > 0

  if (!typed && effective.value.scope === 'all') {
    // The empty state is a launcher, not a dump of the index.
    const byId = new Map(allItems.value.map(i => [i.id, i]))
    const recent = recentIds.value.map(id => byId.get(id)).filter(Boolean) as CommandItem[]
    const pick = (type: CommandItem['type'], n: number) => hits.filter(h => h.item.type === type).slice(0, n)
    const latestPosts = posts.value.slice(0, 3).map(item => ({ item, score: 0, ranges: [] }))
    return [
      { key: 'recent', label: 'Recent', hits: recent.map(item => ({ item, score: 0, ranges: [] })) },
      { key: 'action', label: TYPE_LABEL.action, hits: pick('action', 4) },
      { key: 'post', label: 'Latest posts', hits: latestPosts },
      { key: 'page', label: 'Jump to', hits: pick('page', 6) },
      { key: 'tool', label: TYPE_LABEL.tool, hits: pick('tool', 3) },
    ].filter(s => s.hits.length)
  }

  if (!typed) {
    const groups = TYPE_ORDER.map(type => ({ key: type, label: TYPE_LABEL[type], hits: hits.filter(h => h.item.type === type) }))
    return groups.filter(g => g.hits.length)
  }

  // Typed: the single best hit first, then the rest grouped by type, groups in
  // the order of their own best hit — a strong game match is not buried under
  // three weak page matches just because pages come first.
  const [best, ...rest] = hits
  if (!best)
    return []
  const groups = new Map<CommandItem['type'], SearchHit[]>()
  for (const h of rest)
    groups.set(h.item.type, [...(groups.get(h.item.type) ?? []), h])
  return [
    { key: 'best', label: 'Best match', hits: [best] },
    ...[...groups.entries()].map(([type, list]) => ({ key: type, label: TYPE_LABEL[type], hits: list.slice(0, 8) })),
  ]
})

const rows = computed(() => sections.value.flatMap(s => s.hits))
const activeHit = computed(() => rows.value[active.value])

/** Row index of each section's first row, for rendering. */
const offsets = computed(() => {
  let n = 0
  return sections.value.map((s) => {
    const at = n
    n += s.hits.length
    return at
  })
})

const scopeCounts = computed(() => {
  const typed = effective.value.text.trim().length > 0
  if (!typed)
    return {} as Record<string, number>
  const all = searchCommands(allItems.value, effective.value.text, 500).hits
  return Object.fromEntries(SCOPES.map(s => [s.id, s.types ? all.filter(h => (s.types as readonly string[]).includes(h.item.type)).length : all.length]))
})

watch([query, scope], () => {
  active.value = 0
  listRef.value?.scrollTo({ top: 0 })
})

watch(rows, (list) => {
  status.value = effective.value.text.trim()
    ? (list.length ? `${list.length} results` : 'No results')
    : ''
})

// --- Keyboard ---------------------------------------------------------------

function move(delta: number) {
  const n = rows.value.length
  if (!n)
    return
  active.value = (active.value + delta + n) % n
  nextTick(() => {
    listRef.value?.querySelector<HTMLElement>(`#cmdk-opt-${active.value}`)?.scrollIntoView({ block: 'nearest' })
  })
}

function cycleScope(delta: number) {
  const i = SCOPES.findIndex(s => s.id === scope.value)
  scope.value = SCOPES[(i + delta + SCOPES.length) % SCOPES.length]!.id
}

function onKeydown(e: KeyboardEvent) {
  if (e.isComposing)
    return
  const mod = e.metaKey || e.ctrlKey
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      e.preventDefault()
      move(-1)
      break
    case 'PageDown':
      e.preventDefault()
      move(5)
      break
    case 'PageUp':
      e.preventDefault()
      move(-5)
      break
    case 'Home':
      if (mod) {
        e.preventDefault()
        active.value = 0
        move(0)
      }
      break
    case 'End':
      if (mod) {
        e.preventDefault()
        active.value = Math.max(0, rows.value.length - 1)
        move(0)
      }
      break
    case 'Enter': {
      const hit = activeHit.value
      if (!hit)
        break
      e.preventDefault()
      const action = mod ? hit.item.actions[1] ?? hit.item.actions[0] : hit.item.actions[0]
      if (action)
        run(hit.item, action, { newTab: e.shiftKey })
      break
    }
    case 'Tab':
      // Tab cycles the filter chips, Shift+Tab goes back. The chips are also
      // buttons, so pointer users get the same thing.
      e.preventDefault()
      cycleScope(e.shiftKey ? -1 : 1)
      break
    case 'Backspace':
      if (!query.value && scope.value !== 'all')
        scope.value = 'all'
      break
  }
}

// --- Running actions ---------------------------------------------------------

async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    status.value = 'Copied to clipboard'
    setTimeout(() => {
      if (copiedKey.value === key)
        copiedKey.value = null
    }, 1600)
    return true
  }
  catch {
    status.value = 'Could not copy'
    return false
  }
}

async function run(item: CommandItem, action: CommandAction, opts: { newTab?: boolean } = {}) {
  const q = effective.value.text.trim()
  track(EVENTS.PALETTE_ACTION, {
    item_type: item.type,
    item_id: item.id,
    action: action.label,
    position: rows.value.findIndex(h => h.item.id === item.id),
    query_length: q.length,
    scope: effective.value.scope,
  })
  if (q)
    track(EVENTS.SEARCH, { search_term: q.slice(0, 100) })
  remember(item)

  switch (action.kind) {
    case 'copy':
      await copy(action.value, actionKey(item, action))
      return // stay open: the ✓ is the feedback
    case 'run':
      if (action.value === RUN.toggleTheme) {
        colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
        status.value = `Theme: ${colorMode.preference}`
        return // stay open so the switch is visible behind the dialog
      }
      if (action.value === RUN.copyPageLink) {
        await copy(`${baseData.site.url}${route.path === '/' ? '/' : route.path}`, actionKey(item, action))
        return
      }
      if (action.value === RUN.subscribe) {
        close()
        await nextTick()
        const input = document.getElementById('newsletter-email') as HTMLInputElement | null
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        input?.focus({ preventScroll: true })
      }
      return
    case 'mail':
      close()
      window.location.href = action.value
      return
    case 'external':
      window.open(action.value, '_blank', 'noopener')
      close()
      return
    case 'navigate':
      if (opts.newTab) {
        window.open(action.value, '_blank', 'noopener')
        return
      }
      close()
      await navigateTo(action.value)
  }
}

function onRowClick(index: number, e: MouseEvent) {
  const hit = rows.value[index]
  const action = hit?.item.actions[0]
  if (hit && action)
    run(hit.item, action, { newTab: e.metaKey || e.ctrlKey || e.shiftKey })
}

/** Mouse moves, not mouseenter: a list scrolling under a resting pointer must not steal the selection. */
function onRowPointer(index: number) {
  if (active.value !== index)
    active.value = index
}

// --- Open / close ------------------------------------------------------------

let previousFocus: HTMLElement | null = null

function show() {
  const dialog = dialogRef.value
  if (!dialog || dialog.open)
    return
  previousFocus = document.activeElement as HTMLElement | null
  query.value = initialQuery.value
  scope.value = 'all'
  active.value = 0
  copiedKey.value = null
  readRecents()
  loadPosts()
  dialog.showModal()
  document.documentElement.classList.add('cmdk-lock')
  nextTick(() => {
    const input = inputRef.value
    input?.focus()
    // Caret after a pre-filled query (a hero chip), so typing refines it.
    input?.setSelectionRange(input.value.length, input.value.length)
  })
}

function hide() {
  const dialog = dialogRef.value
  document.documentElement.classList.remove('cmdk-lock')
  if (dialog?.open)
    dialog.close()
  previousFocus?.focus?.({ preventScroll: true })
  previousFocus = null
}

watch(isOpen, open => (open ? show() : hide()))
onMounted(() => {
  if (isOpen.value)
    show()
})
onBeforeUnmount(() => document.documentElement.classList.remove('cmdk-lock'))

/** Esc: the dialog fires `cancel`; clear the query first, close on the second press. */
function onCancel(e: Event) {
  e.preventDefault()
  if (query.value) {
    query.value = ''
    return
  }
  close()
}

function onBackdrop(e: MouseEvent) {
  if (e.target === dialogRef.value)
    close()
}

// Closing by navigation (a link inside a result, browser back) must not leave
// the dialog open over the next page.
watch(() => route.fullPath, () => close())

const askHref = computed(() => `mailto:${baseData.me.email}?subject=${encodeURIComponent(effective.value.text.trim())}`)
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="cmdk-dialog"
      aria-label="Search the site"
      @cancel="onCancel"
      @click="onBackdrop"
    >
      <div class="cmdk-panel flex flex-col overflow-hidden rounded-none sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-slate-950/20 dark:shadow-black/50">
        <!-- Input -->
        <div class="shrink-0 flex items-center gap-3 px-4 sm:px-5 border-b border-slate-200/80 dark:border-white/10">
          <Icon name="mdi:magnify" class="w-5 h-5 shrink-0 text-accent-600 dark:text-accent-400" aria-hidden="true" />
          <input
            ref="inputRef"
            v-model="query"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="cmdk-list"
            :aria-expanded="rows.length > 0"
            :aria-activedescendant="activeHit ? `cmdk-opt-${active}` : undefined"
            aria-label="Search posts, tools, games, music and pages"
            placeholder="Search posts, tools, games, music…"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            enterkeyhint="go"
            class="flex-1 min-w-0 h-14 sm:h-16 bg-transparent text-base sm:text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-0 px-0 outline-none focus:outline-none focus:ring-0 focus:shadow-none"
            @keydown="onKeydown"
          >
          <button
            type="button"
            class="cmdk-kbd hidden sm:inline-flex hover:text-accent-600 dark:hover:text-accent-400"
            aria-label="Close search"
            @click="close"
          >
            Esc
          </button>
          <button type="button" class="sm:hidden -mr-2 p-2 text-sm font-medium text-slate-500 dark:text-slate-400" @click="close">
            Cancel
          </button>
        </div>

        <!-- Scope chips -->
        <div class="shrink-0 flex gap-1.5 px-3 sm:px-4 py-2 overflow-x-auto border-b border-slate-200/60 dark:border-white/5 [scrollbar-width:none]" role="toolbar" aria-label="Filter results">
          <button
            v-for="s in SCOPES"
            :key="s.id"
            type="button"
            tabindex="-1"
            class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
            :class="effective.scope === s.id
              ? 'bg-accent-600 text-white dark:bg-accent-400 dark:text-slate-950'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'"
            :aria-pressed="effective.scope === s.id"
            @click="scope = s.id; inputRef?.focus()"
          >
            {{ s.label }}
            <span v-if="scopeCounts[s.id] !== undefined" class="font-spacemono text-[10px] opacity-70">{{ scopeCounts[s.id] }}</span>
          </button>
        </div>

        <!-- Results -->
        <div id="cmdk-list" ref="listRef" role="listbox" aria-label="Results" class="cmdk-list flex-1 overflow-y-auto overscroll-contain px-2 py-2">
          <p v-if="search.correctedQuery" class="px-3 pt-1 pb-2 text-xs text-slate-500 dark:text-slate-400">
            <Icon name="mdi:auto-fix" class="w-3.5 h-3.5 -mt-0.5 mr-1 inline text-accent-500" aria-hidden="true" />
            Showing results for <span class="font-semibold text-slate-700 dark:text-slate-200">{{ search.correctedQuery }}</span>
          </p>

          <div v-for="(section, si) in sections" :key="section.key" role="group" :aria-labelledby="`cmdk-group-${section.key}`" class="mb-1">
            <p :id="`cmdk-group-${section.key}`" class="px-3 pt-2 pb-1 font-spacemono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Icon v-if="section.key === 'recent'" name="mdi:history" class="w-3 h-3 -mt-0.5 mr-0.5 inline" aria-hidden="true" />
              {{ section.label }}
              <span v-if="section.key === 'post' && postsState === 'loading'" class="normal-case tracking-normal">· loading</span>
            </p>
            <div
              v-for="(hit, hi) in section.hits"
              :id="`cmdk-opt-${offsets[si]! + hi}`"
              :key="`${section.key}:${hit.item.id}`"
              role="option"
              :aria-selected="active === offsets[si]! + hi"
              class="cmdk-row group relative flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-2.5 cursor-pointer select-none"
              :class="active === offsets[si]! + hi ? 'bg-accent-500/10 dark:bg-accent-400/10' : ''"
              @mousemove="onRowPointer(offsets[si]! + hi)"
              @click="onRowClick(offsets[si]! + hi, $event)"
            >
              <span
                class="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900"
                :class="active === offsets[si]! + hi ? 'text-accent-600 dark:text-accent-400' : 'text-slate-500 dark:text-slate-400'"
              >
                <NuxtImg
                  v-if="hit.item.image && !brokenImages.has(hit.item.image)"
                  :src="hit.item.image"
                  alt=""
                  width="40"
                  height="40"
                  densities="x1 x2"
                  format="webp"
                  fit="cover"
                  loading="lazy"
                  class="w-full h-full object-cover"
                  @error="brokenImages.add(hit.item.image)"
                />
                <Icon v-else :name="hit.item.icon" class="w-5 h-5" aria-hidden="true" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block truncate text-[15px] font-medium text-slate-900 dark:text-slate-100">
                  <template v-for="(part, pi) in highlightParts(hit.item.title, hit.ranges)" :key="pi">
                    <mark v-if="part.match" class="bg-transparent text-accent-600 dark:text-accent-400 font-semibold">{{ part.text }}</mark>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </span>
                <span v-if="hit.item.subtitle" class="block truncate text-xs text-slate-500 dark:text-slate-400">{{ hit.item.subtitle }}</span>
              </span>

              <!-- Actions: visible on the highlighted row (and on hover), always reachable by pointer. -->
              <!-- On phones they drop to their own line under the title instead of squeezing it. -->
              <span class="cmdk-actions basis-full sm:basis-auto pl-[3.25rem] sm:pl-0 shrink-0 flex-wrap items-center gap-1.5" :class="active === offsets[si]! + hi ? 'flex' : 'hidden sm:group-hover:flex'">
                <button
                  v-for="(action, ai) in hit.item.actions.slice(0, 3)"
                  :key="action.label"
                  type="button"
                  tabindex="-1"
                  class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
                  :class="ai === 0
                    ? 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300'
                    : 'border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-accent-500/60 hover:text-accent-600 dark:hover:text-accent-400'"
                  @click.stop="run(hit.item, action, { newTab: $event.metaKey || $event.ctrlKey })"
                >
                  <Icon v-if="copiedKey === actionKey(hit.item, action)" name="mdi:check" class="w-3.5 h-3.5" aria-hidden="true" />
                  <Icon v-else-if="action.icon" :name="action.icon" class="w-3.5 h-3.5" aria-hidden="true" />
                  {{ copiedKey === actionKey(hit.item, action) ? 'Copied' : action.label }}
                  <kbd v-if="ai === 0" class="hidden sm:inline font-spacemono text-[10px] opacity-80" aria-hidden="true">↵</kbd>
                  <kbd v-else-if="ai === 1" class="hidden sm:inline font-spacemono text-[10px] opacity-60" aria-hidden="true">{{ modKey }}↵</kbd>
                </button>
              </span>
              <span v-if="active !== offsets[si]! + hi" class="hidden sm:inline group-hover:hidden shrink-0 font-spacemono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {{ TYPE_LABEL[hit.item.type].replace(/s$/, '').replace('Quick action', 'Action') }}
              </span>
            </div>
          </div>

          <!-- Nothing found -->
          <div v-if="!rows.length" class="px-4 py-10 text-center">
            <p class="text-slate-700 dark:text-slate-200">
              Nothing for <span class="font-semibold">“{{ effective.text.trim() }}”</span>
            </p>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Try another word, or ask me directly.
            </p>
            <div class="mt-5 flex flex-wrap justify-center gap-2">
              <a :href="askHref" class="inline-flex items-center gap-1.5 rounded-lg bg-accent-600 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300" @click="close">
                <Icon name="mdi:email-fast-outline" class="w-4 h-4" aria-hidden="true" /> Ask Andrei
              </a>
              <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-accent-500/60" @click="query = ''; scope = 'all'; inputRef?.focus()">
                Clear search
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="shrink-0 hidden sm:flex items-center justify-between gap-4 px-5 py-2.5 border-t border-slate-200/80 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-1.5"><kbd class="cmdk-kbd">↑</kbd><kbd class="cmdk-kbd">↓</kbd> navigate</span>
            <span class="inline-flex items-center gap-1.5"><kbd class="cmdk-kbd">↵</kbd> open</span>
            <span class="inline-flex items-center gap-1.5"><kbd class="cmdk-kbd">{{ modKey }} ↵</kbd> second action</span>
            <span class="inline-flex items-center gap-1.5"><kbd class="cmdk-kbd">Tab</kbd> filter</span>
          </div>
          <span class="inline-flex items-center gap-1.5">Type <kbd class="cmdk-kbd">&gt;</kbd> for actions</span>
        </div>
        <p class="sr-only" role="status" aria-live="polite">
          {{ status }}
        </p>
      </div>
    </dialog>
  </Teleport>
</template>

<style>
/* Unscoped: <dialog> is teleported to <body> and its ::backdrop is not reachable from scoped CSS. */
.cmdk-dialog {
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  width: 100%;
  max-width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  overflow: visible;
  color: inherit;
}
.cmdk-dialog::backdrop {
  background: rgb(2 6 23 / 0.45);
  backdrop-filter: blur(4px);
}
.cmdk-panel {
  height: 100%;
}
@media (min-width: 640px) {
  .cmdk-dialog {
    margin-top: 12vh;
    width: calc(100% - 2rem);
    max-width: 44rem;
    height: auto;
    max-height: 76vh;
  }
  .cmdk-panel {
    height: auto;
    max-height: 76vh;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .cmdk-dialog[open] .cmdk-panel {
    animation: cmdk-in 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cmdk-dialog[open]::backdrop {
    animation: cmdk-fade 160ms ease-out;
  }
}
@keyframes cmdk-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.985); }
}
@keyframes cmdk-fade {
  from { opacity: 0; }
}
/* The page behind a modal must not scroll under the wheel or a swipe. */
html.cmdk-lock {
  overflow: hidden;
}
</style>
