<script setup>
import { siteMetaData } from './data'

useHead({
  htmlAttrs: {
    lang: 'en',
  },
  meta: () => siteMetaData,
})
</script>

<template>
  <div class="bg-bg dark:text-slate-300">
    <NuxtLoadingIndicator
      :height="3"
      color="var(--color-accent-400)"
    />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Explicit property list (not `all`) so nothing else accidentally animates.
   A quick fade plus a small horizontal slide: the HUD swapping screens. No
   blur, which forces the GPU to re-rasterize the whole page every frame. */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

html.dark{
  color-scheme: dark;
}
</style>
