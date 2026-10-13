<script setup lang="ts">
import { EVENTS } from '~/data/analytics'
import { linkedInPost, linkedInShareUrl, xPost, xShareUrl } from '~/utils/til'

// Share row on a note. LinkedIn and X open prefilled with the same text the
// studio offers the author, so a reader's share reads like a recommendation
// rather than a bare link.

const props = defineProps<{
  slug: string
  url: string
  title: string
  excerpt: string
  topics: string[]
}>()

const { track } = useAnalytics()
const copied = ref(false)

const linkedin = computed(() => linkedInShareUrl(linkedInPost(props, props.url)))
const x = computed(() => xShareUrl(xPost(props, props.url)))

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  }
  catch {}
  track(EVENTS.TIL_SHARE, { slug: props.slug, network: 'copy' })
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="eyebrow mr-1">Share</span>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors hover:cursor-pointer"
      @click="copyLink"
    >
      <Icon :name="copied ? 'mdi:check' : 'mdi:link-variant'" size="14" aria-hidden="true" />
      {{ copied ? 'Copied' : 'Copy link' }}
    </button>
    <a
      :href="linkedin"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      @click="track(EVENTS.TIL_SHARE, { slug, network: 'linkedin' })"
    >
      <Icon name="fa:linkedin" size="14" aria-hidden="true" />
      LinkedIn
    </a>
    <a
      :href="x"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      @click="track(EVENTS.TIL_SHARE, { slug, network: 'x' })"
    >
      <Icon name="fa:twitter" size="14" aria-hidden="true" />
      Post on X
    </a>
  </div>
</template>
