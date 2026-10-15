<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useBlogStudio } from '~/composables/useBlogStudio'
import { useTilStudio } from '~/composables/useTilStudio'
import { useUnsavedGuard } from '~/composables/useUnsavedGuard'
import { baseData } from '~/data'
import { TIL_TOPICS } from '~/data/til'
import { isValidSlug, slugify } from '~/utils/blog-post'
import { excerptOf, linkedInPost, linkedInShareUrl, NOTE_MAX_CHARS, NOTE_TITLE_MAX, notePath, noteWarnings, RESERVED_NOTE_SLUGS, xPost, xShareUrl } from '~/utils/til'

// The TIL editor. Built for a phone: four fields, the warnings that decide
// whether a short note gets indexed shown live, and once the note is live,
// the LinkedIn and X posts ready to copy.

const props = defineProps<{ slug: string }>()

const { getNote, saveNote, deleteNote } = useTilStudio()
const { preview } = useBlogStudio()
const router = useRouter()

const isNew = computed(() => props.slug === 'new')

const TEMPLATE = `One line: what went wrong, or what you needed.

\`\`\`ts
// the fix
\`\`\`

One line: why it works, or where it bit you.

Source: https://`

const form = reactive({
  slug: '',
  title: '',
  topics: [] as string[],
  markdown: '',
  published: false,
  createdAt: '',
})

const loading = ref(!isNew.value)
const saving = ref(false)
const deleting = ref(false)
const errorMsg = ref('')
const savedAt = ref('')
const dirty = ref(false)
const slugTouched = ref(false)
const livePublished = ref(false)

const previewBody = ref<Record<string, unknown> | null>(null)
const showPreview = ref(false)

const warnings = computed(() => form.title || form.markdown ? noteWarnings(form) : [])
const excerpt = computed(() => excerptOf(form.markdown, form.title))
const url = computed(() => `${baseData.site.url}${notePath(form.slug)}`)
const linkedin = computed(() => linkedInPost({ title: form.title, excerpt: excerpt.value, topics: form.topics }, url.value))
const x = computed(() => xPost(form, url.value))
const slugOk = computed(() => isValidSlug(form.slug) && !RESERVED_NOTE_SLUGS.has(form.slug))

async function load() {
  if (isNew.value)
    return
  try {
    const note = await getNote(props.slug)
    Object.assign(form, {
      slug: note.slug,
      title: note.title,
      topics: [...note.topics],
      markdown: note.markdown,
      published: note.published,
      createdAt: note.createdAt,
    })
    livePublished.value = note.published
    // Let the deep `watch(form)` below flush while `loading` is still true;
    // otherwise it fires after the finally block and marks a freshly loaded
    // post as edited.
    await nextTick()
    dirty.value = false
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load note'
  }
  finally {
    loading.value = false
  }
}

watch(() => form.title, (title) => {
  if (isNew.value && !slugTouched.value)
    form.slug = slugify(title)
})

watch(form, () => {
  if (!loading.value)
    dirty.value = true
})

const refreshPreview = useDebounceFn(async () => {
  if (!showPreview.value || !form.markdown.trim())
    return
  try {
    previewBody.value = (await preview(form.markdown)).body
  }
  catch {}
}, 500)
watch(() => [form.markdown, showPreview.value], () => void refreshPreview())

function toggleTopic(id: string) {
  const i = form.topics.indexOf(id)
  if (i >= 0)
    form.topics.splice(i, 1)
  else form.topics.push(id)
}

async function onSave() {
  if (saving.value)
    return
  saving.value = true
  errorMsg.value = ''
  try {
    const saved = await saveNote({ ...form }, isNew.value ? 'create' : 'update')
    dirty.value = false
    livePublished.value = saved.published
    savedAt.value = new Date().toLocaleTimeString()
    if (isNew.value)
      await router.replace(`/studio/notes/${saved.slug}`)
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Save failed'
  }
  finally {
    saving.value = false
  }
}

async function onDelete() {
  // eslint-disable-next-line no-alert
  if (!globalThis.confirm(`Delete "${form.title}"? This cannot be undone.`))
    return
  deleting.value = true
  try {
    await deleteNote(form.slug)
    dirty.value = false
    await router.replace('/studio?tab=notes')
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Delete failed'
    deleting.value = false
  }
}

const copied = ref('')
async function copy(kind: 'linkedin' | 'x', text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = kind
    setTimeout(() => (copied.value = ''), 1600)
  }
  catch {}
}

useUnsavedGuard(dirty)

onMounted(load)
</script>

<template>
  <div v-if="loading" class="text-sm text-slate-500">
    Loading note…
  </div>

  <div v-else class="pb-28">
    <p v-if="errorMsg" class="mb-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {{ errorMsg }}
    </p>

    <div class="grid gap-5">
      <label class="block">
        <span class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
          Question <span class="font-normal normal-case tracking-normal" :class="form.title.length > NOTE_TITLE_MAX ? 'text-red-500' : ''">{{ form.title.length }}/{{ NOTE_TITLE_MAX }}</span>
        </span>
        <input
          v-model="form.title"
          type="text"
          placeholder="How to … in …"
          class="w-full border border-line-strong bg-panel px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-accent-500/60"
        >
        <span class="mt-1 block text-xs text-slate-500">The title, phrased the way someone would search for it. In English.</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Slug
          <span v-if="!isNew" class="ml-1 font-normal normal-case tracking-normal text-slate-400">locked — the URL is published</span>
        </span>
        <input
          v-model="form.slug"
          type="text"
          :disabled="!isNew"
          class="w-full border border-line-strong bg-panel px-3 py-2 font-spacemono text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-500/60"
          @input="slugTouched = true"
        >
        <span class="mt-1 block font-spacemono text-xs" :class="form.slug && !slugOk ? 'text-red-500' : 'text-slate-500'">/til/{{ form.slug || '…' }}</span>
      </label>

      <div>
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Topics</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in TIL_TOPICS"
            :key="t.id"
            type="button"
            class="border px-3 py-1 text-sm transition-colors hover:cursor-pointer"
            :class="form.topics.includes(t.id)
              ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950'
              : 'border-line-strong text-fg-muted'"
            :aria-pressed="form.topics.includes(t.id)"
            @click="toggleTopic(t.id)"
          >
            {{ t.name }}
          </button>
        </div>
      </div>

      <div>
        <div class="mb-1 flex flex-wrap items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Note (markdown)</span>
          <button
            v-if="!form.markdown.trim()"
            type="button"
            class="text-xs underline text-slate-500 hover:text-fg hover:cursor-pointer"
            @click="form.markdown = TEMPLATE"
          >
            Insert template
          </button>
          <span class="ml-auto font-spacemono text-xs" :class="form.markdown.length > NOTE_MAX_CHARS ? 'text-red-500' : 'text-slate-400'">{{ form.markdown.length }}/{{ NOTE_MAX_CHARS }}</span>
          <button type="button" class="text-xs underline text-slate-500 hover:text-fg hover:cursor-pointer" @click="showPreview = !showPreview">
            {{ showPreview ? 'Hide preview' : 'Preview' }}
          </button>
        </div>
        <textarea
          v-model="form.markdown"
          rows="12"
          spellcheck="true"
          class="w-full border border-line-strong bg-panel px-3 py-2 font-spacemono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-500/60"
        />
        <p v-if="excerpt" class="mt-1 text-xs text-slate-500">
          <span class="font-semibold">Search snippet:</span> {{ excerpt }}
        </p>
      </div>

      <ul v-if="warnings.length" class="border border-amber-300/70 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 space-y-1">
        <li v-for="w in warnings" :key="w" class="flex gap-2">
          <Icon name="mdi:lightbulb-on-outline" size="16" class="mt-0.5 shrink-0" aria-hidden="true" />
          {{ w }}
        </li>
      </ul>

      <section v-if="showPreview" class="border border-line p-4">
        <h2 class="mb-2 text-lg font-bold">
          {{ form.title || 'Untitled' }}
        </h2>
        <div v-if="previewBody" class="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none">
          <ContentRenderer :value="{ body: previewBody }" />
        </div>
      </section>

      <label class="inline-flex items-center gap-2 text-sm">
        <input v-model="form.published" type="checkbox" class="border-line-strong">
        Published
      </label>

      <section v-if="livePublished && !dirty" class="border border-accent-500/30 bg-accent-500/5 p-4">
        <h2 class="mb-1 text-sm font-semibold">
          Share it
        </h2>
        <p class="mb-3 text-xs text-slate-500">
          LinkedIn is where hiring managers will see it. Paste, add a line of your own, post.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="item in [{ kind: 'linkedin' as const, label: 'LinkedIn', text: linkedin, href: linkedInShareUrl(linkedin) }, { kind: 'x' as const, label: 'X', text: x, href: xShareUrl(x) }]" :key="item.kind">
            <pre class="h-36 overflow-auto whitespace-pre-wrap border border-line bg-panel p-2 text-xs">{{ item.text }}</pre>
            <div class="mt-2 flex gap-3 text-xs">
              <button type="button" class="underline hover:cursor-pointer" @click="copy(item.kind, item.text)">
                {{ copied === item.kind ? 'Copied' : `Copy for ${item.label}` }}
              </button>
              <a :href="item.href" target="_blank" rel="noopener" class="underline">Open {{ item.label }}</a>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel px-4 py-3">
      <div class="mx-auto flex max-w-4xl items-center gap-3">
        <span class="min-w-0 flex-1 truncate text-xs text-fg-muted">
          <template v-if="dirty">Unsaved changes</template>
          <template v-else-if="savedAt">Saved at {{ savedAt }}</template>
          <template v-else>{{ form.published ? 'Published' : 'Draft' }}</template>
        </span>
        <NuxtLink v-if="!isNew && livePublished" :to="notePath(form.slug)" target="_blank" class="text-xs underline text-slate-500 hover:text-fg">
          View
        </NuxtLink>
        <button v-if="!isNew" type="button" :disabled="deleting" class="text-xs underline text-red-600 dark:text-red-400 disabled:opacity-40 hover:cursor-pointer" @click="onDelete">
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
        <button
          type="button"
          :disabled="saving"
          class="skew-box btn btn-primary btn-sm shrink-0"
          @click="onSave"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>
