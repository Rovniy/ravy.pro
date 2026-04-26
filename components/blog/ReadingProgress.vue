<script setup lang="ts">
const { y } = useWindowScroll()

const progress = computed(() => {
  if (!import.meta.client) return 0
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  return scrollable > 0 ? Math.min(100, (y.value / scrollable) * 100) : 0
})
</script>

<template>
  <div
    aria-hidden="true"
    class="fixed top-0 left-0 z-50 h-[3px] bg-sky-500 transition-[width] duration-100 ease-linear"
    :style="{ width: `${progress}%` }"
  />
</template>
