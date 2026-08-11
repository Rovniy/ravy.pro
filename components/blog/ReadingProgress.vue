<script setup lang="ts">
import { EVENTS } from '~/data/analytics'

const props = defineProps<{ slug?: string }>()

const { y } = useWindowScroll()

// Scrollable height is cached instead of measured inside the computed. Reading
// `scrollHeight`/`innerHeight` on every scroll tick and then writing the bar's
// inline width (below) is a read-after-write — a forced synchronous layout on
// every frame of every scroll, on every post. A ResizeObserver on the document
// element keeps the cached value honest, including when lazy-loaded images
// change the page height as the reader scrolls.
const scrollable = ref(0)
let observer: ResizeObserver | null = null

function measure() {
  scrollable.value = document.documentElement.scrollHeight - window.innerHeight
}

onMounted(() => {
  measure()
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(measure)
    observer.observe(document.documentElement)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

useEventListener('resize', measure, { passive: true })

const progress = computed(() =>
  scrollable.value > 0 ? Math.min(100, (y.value / scrollable.value) * 100) : 0)

// Fire each read-depth milestone once per page (25/50/75 → progress, 100 → complete).
const { track } = useAnalytics()
const fired = new Set<number>()
watch(progress, (p) => {
  for (const m of [25, 50, 75, 100]) {
    if (p >= m && !fired.has(m)) {
      fired.add(m)
      if (m === 100)
        track(EVENTS.BLOG_COMPLETE, { slug: props.slug })
      else
        track(EVENTS.BLOG_READ_PROGRESS, { slug: props.slug, percent: m })
    }
  }
})
</script>

<template>
  <div
    aria-hidden="true"
    class="fixed top-0 left-0 z-50 h-[3px] bg-accent-500 transition-[width] duration-100 ease-linear"
    :style="{ width: `${progress}%` }"
  />
</template>
