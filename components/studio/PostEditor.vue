<script setup lang="ts">
import type { BlogPostRecord } from '~/utils/blog-post'
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useBlogStudio } from '~/composables/useBlogStudio'
import { BlogPostTag } from '~/data'
import { DEFAULT_LOCALE, isValidSlug, RESERVED_SLUGS, slugify } from '~/utils/blog-post'

const props = defineProps<{ slug: string }>()

const { getPost, savePost, deletePost, preview, uploadImage } = useBlogStudio()
const router = useRouter()

const isNew = computed(() => props.slug === 'new')

const form = reactive({
  slug: '',
  title: '',
  description: '',
  alt: '',
  image: '',
  ogImage: '',
  tags: [] as string[],
  published: false,
  trending: false,
  noindex: false,
  theme: '',
  locale: DEFAULT_LOCALE,
  markdown: '',
  createdAt: '',
})

const loading = ref(!isNew.value)
const saving = ref(false)
const deleting = ref(false)
const errorMsg = ref('')
const savedAt = ref('')
const dirty = ref(false)

// `mode` decides which field an upload lands in, so one file input serves the
// cover, the OG image and inline body images.
type UploadMode = 'cover' | 'og' | 'inline'
const uploadMode = ref<UploadMode>('inline')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const bodyInput = ref<HTMLTextAreaElement | null>(null)

const previewBody = ref<Record<string, unknown> | null>(null)
const previewError = ref('')
const showPreview = ref(false)

const slugTouched = ref(false)

const canUpload = computed(() => isValidSlug(form.slug) && !RESERVED_SLUGS.has(form.slug))

async function load() {
  if (isNew.value)
    return
  loading.value = true
  errorMsg.value = ''
  try {
    const post: BlogPostRecord = await getPost(props.slug)
    Object.assign(form, {
      slug: post.slug,
      title: post.title,
      description: post.description,
      alt: post.alt,
      image: post.image,
      ogImage: post.ogImage,
      tags: [...post.tags],
      published: post.published,
      trending: post.trending,
      noindex: post.noindex,
      theme: post.theme,
      locale: post.locale,
      markdown: post.markdown,
      createdAt: post.createdAt,
    })
    dirty.value = false
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to load post'
  }
  finally {
    loading.value = false
  }
}

// The slug follows the title only until it is edited by hand, and never for a
// post that already exists — its URL is published and must not move.
watch(() => form.title, (title) => {
  if (isNew.value && !slugTouched.value)
    form.slug = slugify(title)
})

watch(form, () => {
  if (!loading.value)
    dirty.value = true
})

const refreshPreview = useDebounceFn(async () => {
  if (!showPreview.value)
    return
  previewError.value = ''
  try {
    previewBody.value = (await preview(form.markdown)).body
  }
  catch (e: unknown) {
    previewError.value = e instanceof Error ? e.message : 'Preview failed'
  }
}, 600)

watch(() => [form.markdown, showPreview.value], () => void refreshPreview())

function toggleTag(tag: string) {
  const idx = form.tags.indexOf(tag)
  if (idx >= 0)
    form.tags.splice(idx, 1)
  else form.tags.push(tag)
}

function insertAtCursor(text: string) {
  const el = bodyInput.value
  if (!el) {
    form.markdown += `\n${text}\n`
    return
  }
  const start = el.selectionStart ?? form.markdown.length
  const end = el.selectionEnd ?? start
  form.markdown = form.markdown.slice(0, start) + text + form.markdown.slice(end)
  void nextTick(() => {
    el.focus()
    const pos = start + text.length
    el.setSelectionRange(pos, pos)
  })
}

function pickFile(mode: UploadMode) {
  uploadMode.value = mode
  fileInput.value?.click()
}

async function onFileChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file)
    return

  uploading.value = true
  errorMsg.value = ''
  try {
    const { url } = await uploadImage(file, form.slug)
    if (uploadMode.value === 'cover')
      form.image = url
    else if (uploadMode.value === 'og')
      form.ogImage = url
    else insertAtCursor(`\n![${form.title || 'image'}](${url})\n`)
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Upload failed'
  }
  finally {
    uploading.value = false
  }
}

async function onSave() {
  if (saving.value)
    return
  saving.value = true
  errorMsg.value = ''
  try {
    const saved = await savePost({ ...form }, isNew.value ? 'create' : 'update')
    dirty.value = false
    savedAt.value = new Date().toLocaleTimeString()
    if (isNew.value)
      await router.replace(`/studio/${saved.slug}`)
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
  errorMsg.value = ''
  try {
    await deletePost(form.slug)
    await router.replace('/studio')
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Delete failed'
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="text-sm text-slate-500">
    Loading post…
  </div>

  <div v-else class="pb-28">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onFileChosen"
    >

    <p v-if="errorMsg" class="mb-4 rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
      {{ errorMsg }}
    </p>

    <div class="grid gap-4">
      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Title</span>
        <input
          v-model="form.title"
          type="text"
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/60"
        >
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
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-spacemono text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-accent-500/60"
          @input="slugTouched = true"
        >
        <span class="mt-1 block font-spacemono text-xs text-slate-500">/blogs/{{ form.slug || '…' }}</span>
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/60"
        />
        <span class="mt-1 block text-xs text-slate-500">Used as the meta description, the card blurb and the alt text fallback.</span>
      </label>

      <div>
        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tag in BlogPostTag"
            :key="tag"
            type="button"
            class="rounded-full border px-3 py-1 text-sm transition-colors hover:cursor-pointer"
            :class="form.tags.includes(tag)
              ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-400 dark:bg-accent-400 dark:text-slate-950'
              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Cover image</span>
          <img v-if="form.image" :src="form.image" alt="" class="mb-2 h-28 w-full rounded-md object-cover border border-slate-200 dark:border-slate-800">
          <div class="flex gap-2">
            <input
              v-model="form.image"
              type="text"
              placeholder="/media/blog/…"
              class="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-spacemono text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/60"
            >
            <button
              type="button"
              :disabled="!canUpload || uploading"
              class="shrink-0 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs disabled:opacity-40 hover:cursor-pointer"
              @click="pickFile('cover')"
            >
              Upload
            </button>
          </div>
        </div>

        <div>
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">OpenGraph image</span>
          <img v-if="form.ogImage" :src="form.ogImage" alt="" class="mb-2 h-28 w-full rounded-md object-cover border border-slate-200 dark:border-slate-800">
          <div class="flex gap-2">
            <input
              v-model="form.ogImage"
              type="text"
              placeholder="defaults to the cover"
              class="min-w-0 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-spacemono text-xs focus:outline-none focus:ring-2 focus:ring-accent-500/60"
            >
            <button
              type="button"
              :disabled="!canUpload || uploading"
              class="shrink-0 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs disabled:opacity-40 hover:cursor-pointer"
              @click="pickFile('og')"
            >
              Upload
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label class="inline-flex items-center gap-2">
          <input v-model="form.published" type="checkbox" class="rounded border-slate-300 dark:border-slate-700">
          Published
        </label>
        <label class="inline-flex items-center gap-2">
          <input v-model="form.trending" type="checkbox" class="rounded border-slate-300 dark:border-slate-700">
          Trending
        </label>
        <label class="inline-flex items-center gap-2">
          <input v-model="form.noindex" type="checkbox" class="rounded border-slate-300 dark:border-slate-700">
          Hide from search engines
        </label>
      </div>

      <div>
        <div class="mb-1 flex flex-wrap items-center gap-3">
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Body (markdown)</span>
          <button
            type="button"
            :disabled="!canUpload || uploading"
            class="text-xs underline text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 hover:cursor-pointer"
            @click="pickFile('inline')"
          >
            {{ uploading ? 'Uploading…' : 'Insert image' }}
          </button>
          <button
            type="button"
            class="ml-auto text-xs underline text-slate-500 hover:text-slate-900 dark:hover:text-white hover:cursor-pointer"
            @click="showPreview = !showPreview"
          >
            {{ showPreview ? 'Hide preview' : 'Show preview' }}
          </button>
        </div>
        <p v-if="!canUpload" class="mb-2 text-xs text-amber-600 dark:text-amber-400">
          Give the post a title first — uploads are filed under its slug.
        </p>
        <textarea
          ref="bodyInput"
          v-model="form.markdown"
          rows="22"
          spellcheck="false"
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-spacemono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-500/60"
        />
      </div>

      <section v-if="showPreview" class="rounded-md border border-slate-200 dark:border-slate-800 p-4">
        <h2 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Preview
        </h2>
        <p v-if="previewError" class="text-sm text-red-600 dark:text-red-400">
          {{ previewError }}
        </p>
        <!-- Same renderer and the same prose classes as pages/blogs/[blog].vue,
             so what is shown here is what ships. -->
        <div
          v-else-if="previewBody"
          class="prose prose-sm sm:prose-base prose-slate dark:prose-invert max-w-none prose-img:rounded-lg"
        >
          <ContentRenderer :value="{ body: previewBody }" />
        </div>
        <p v-else class="text-sm text-slate-500">
          Rendering…
        </p>
      </section>
    </div>

    <!-- Sticky action bar: on a phone the form is long and the save button
         should never be a scroll away. -->
    <div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur px-4 py-3">
      <div class="mx-auto flex max-w-4xl items-center gap-3">
        <span class="min-w-0 flex-1 truncate text-xs text-slate-500 dark:text-slate-400">
          <template v-if="dirty">Unsaved changes</template>
          <template v-else-if="savedAt">Saved at {{ savedAt }}</template>
          <template v-else>{{ form.published ? 'Published' : 'Draft' }}</template>
        </span>

        <NuxtLink
          v-if="!isNew && form.published"
          :to="`/blogs/${form.slug}`"
          target="_blank"
          class="text-xs underline text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          View
        </NuxtLink>

        <button
          v-if="!isNew"
          type="button"
          :disabled="deleting"
          class="text-xs underline text-red-600 dark:text-red-400 disabled:opacity-40 hover:cursor-pointer"
          @click="onDelete"
        >
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>

        <button
          type="button"
          :disabled="saving"
          class="shrink-0 rounded-md bg-slate-900 dark:bg-white px-5 py-2 text-sm font-medium text-white dark:text-slate-900 disabled:opacity-50 hover:opacity-90 hover:cursor-pointer"
          @click="onSave"
        >
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>
