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
  <div class="bg-slate-100 dark:text-slate-300   dark:bg-slate-950">
    <NuxtLoadingIndicator
      :height="3"
      color="linear-gradient(90deg, var(--color-accent-400), var(--color-emerald-400), var(--color-accent-400))"
    />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Explicit property list (not `all`) so nothing else accidentally animates,
   and a lighter blur — blur(1rem) forces the GPU to re-rasterize the whole
   page layer every frame of the transition. */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(6px);
}

.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.15s, filter 0.15s;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
  filter: blur(6px);
}

html.dark{
  color-scheme: dark;
}
</style>
