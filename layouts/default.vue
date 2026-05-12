<script setup lang="ts">
import { seoData } from '~/data'

const route = useRoute()

// Canonical URL covers every page from one place. Strip the trailing slash
// from the configured site URL and the leading-only-on-root from path so
// the result is e.g. https://ravy.pro/blogs (no double slash, no trailing).
const canonicalHref = computed(() => {
  const origin = seoData.mySite.replace(/\/+$/, '')
  const path = route.path === '/' ? '' : route.path.replace(/\/+$/, '')
  return `${origin}${path}`
})

useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/ico',
      href: '/favicon.ico',
    },
    {
      rel: 'canonical',
      href: canonicalHref,
    },
  ],
})
</script>

<template>
  <div class="gd-container font-spacegrotesk">
    <MainHeader />

    <main class="pt-[var(--header-h)]">
      <slot />
    </main>

    <LazyMainFooter />

    <ClientOnly>
      <LazyMainCookieBanner />
    </ClientOnly>
  </div>
</template>

<style scoped>
.gd-container {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
}
</style>
