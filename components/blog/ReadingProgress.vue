<script setup lang="ts">
import { EVENTS } from '~/data/analytics'

const props = defineProps<{ slug?: string }>()

const { y } = useWindowScroll()

const progress = computed(() => {
  if (!import.meta.client)
    return 0
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  return scrollable > 0 ? Math.min(100, (y.value / scrollable) * 100) : 0
})

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
    class="fixed top-0 left-0 z-50 h-[3px] bg-sky-500 transition-[width] duration-100 ease-linear"
    :style="{ width: `${progress}%` }"
  />
</template>
