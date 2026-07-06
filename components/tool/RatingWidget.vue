<script setup lang="ts">
import type { ToolId } from '~/data/analytics'
import type { ToolVote } from '~/types/rating'
import { toolIdFromPath } from '~/data/analytics'

// The tool id normally comes from the route (same resolution as the auto
// `tool_view` event in useToolPageSchema), so new tool pages just drop
// `<ToolRatingWidget />` into their header. The prop is an override for
// pages whose path isn't mapped in toolIdFromPath.
const props = defineProps<{ toolId?: ToolId }>()

const resolvedToolId = props.toolId ?? toolIdFromPath(useRoute().path)

const { summary, pending, myVote, voting, vote } = useToolRating(resolvedToolId)

// Which button was pressed — drives the per-button spinner while the vote is
// in flight (the composable's `voting` covers both buttons).
const clickedVote = ref<ToolVote | null>(null)

async function castVote(v: ToolVote) {
  if (voting.value || myVote.value === v)
    return
  clickedVote.value = v
  try {
    await vote(v)
  }
  finally {
    clickedVote.value = null
  }
}

// The displayed average tweens toward the server value after a vote; the star
// fill is bound to the same number so both animate together. The very first
// load snaps into place — only changes animate.
const displayAverage = ref<number | null>(null)
const bump = ref(false)
let rafId = 0
let bumpTimer: ReturnType<typeof setTimeout> | undefined

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

watch(() => summary.value?.average, (next) => {
  if (next == null)
    return
  const from = displayAverage.value
  if (from == null || from === next || prefersReducedMotion()) {
    displayAverage.value = next
    return
  }

  bump.value = true
  clearTimeout(bumpTimer)
  cancelAnimationFrame(rafId)
  const start = performance.now()
  const duration = 600
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const eased = 1 - (1 - t) ** 3
    displayAverage.value = Math.round((from + (next - from) * eased) * 100) / 100
    if (t < 1) {
      rafId = requestAnimationFrame(step)
    }
    else {
      displayAverage.value = next
      bumpTimer = setTimeout(() => (bump.value = false), 200)
    }
  }
  rafId = requestAnimationFrame(step)
}, { immediate: true })

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  clearTimeout(bumpTimer)
})

const starsPercent = computed(() => displayAverage.value != null ? (displayAverage.value / 5) * 100 : 0)
const averageText = computed(() => displayAverage.value != null ? displayAverage.value.toFixed(1) : '')
const ratingLabel = computed(() =>
  summary.value ? `Rated ${summary.value.average} out of 5 based on ${summary.value.count} votes` : '')

const BUTTON_BASE = 'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent-500/60 disabled:opacity-60 disabled:active:scale-100'
const BUTTON_ACTIVE = 'border-accent-400 text-accent-600 dark:border-accent-500/60 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/50'
const BUTTON_IDLE = 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 hover:-translate-y-px'
</script>

<template>
  <div class="flex flex-col items-end gap-1.5 text-sm shrink-0">
    <!-- Loaded -->
    <template v-if="summary">
      <div class="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
        <span class="relative inline-flex" role="img" :aria-label="ratingLabel">
          <span class="flex text-slate-300 dark:text-slate-600">
            <Icon v-for="i in 5" :key="`bg-${i}`" name="mdi:star" class="w-4 h-4" aria-hidden="true" />
          </span>
          <span
            class="absolute inset-0 flex overflow-hidden text-amber-400"
            :style="{ width: `${starsPercent}%` }"
            aria-hidden="true"
          >
            <Icon v-for="i in 5" :key="`fg-${i}`" name="mdi:star" class="w-4 h-4 shrink-0" />
          </span>
        </span>
        <span
          class="font-semibold tabular-nums transition-all duration-200"
          :class="bump ? 'scale-125 text-accent-600 dark:text-accent-400' : 'text-slate-900 dark:text-slate-100'"
        >{{ averageText }}</span>
        <span class="text-xs text-slate-500 dark:text-slate-400">{{ summary.count.toLocaleString('en-US') }} votes</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          :class="[BUTTON_BASE, myVote === 'like' ? BUTTON_ACTIVE : BUTTON_IDLE, voting ? 'cursor-wait' : '']"
          :aria-pressed="myVote === 'like'"
          aria-label="Like this tool"
          :aria-busy="clickedVote === 'like'"
          :disabled="voting"
          @click="castVote('like')"
        >
          <Icon
            :name="clickedVote === 'like' ? 'mdi:loading' : myVote === 'like' ? 'mdi:thumb-up' : 'mdi:thumb-up-outline'"
            class="w-3.5 h-3.5"
            :class="clickedVote === 'like' ? 'animate-spin' : ''"
            aria-hidden="true"
          />
          Like
        </button>
        <button
          type="button"
          :class="[BUTTON_BASE, myVote === 'dislike' ? BUTTON_ACTIVE : BUTTON_IDLE, voting ? 'cursor-wait' : '']"
          :aria-pressed="myVote === 'dislike'"
          aria-label="Dislike this tool"
          :aria-busy="clickedVote === 'dislike'"
          :disabled="voting"
          @click="castVote('dislike')"
        >
          <Icon
            :name="clickedVote === 'dislike' ? 'mdi:loading' : myVote === 'dislike' ? 'mdi:thumb-down' : 'mdi:thumb-down-outline'"
            class="w-3.5 h-3.5"
            :class="clickedVote === 'dislike' ? 'animate-spin' : ''"
            aria-hidden="true"
          />
          Dislike
        </button>
      </div>
    </template>

    <!-- Loading skeleton (same footprint as the loaded state → no CLS);
         after a failed fetch nothing renders — the feature degrades silently. -->
    <div v-else-if="pending" class="flex flex-col items-end gap-1.5 animate-pulse" aria-hidden="true">
      <div class="h-5 w-40 rounded bg-slate-200 dark:bg-slate-800" />
      <div class="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
</template>
