<script setup lang="ts">
import { seoData } from '~/data'

const route = useRoute()

// Canonical URL covers every page from one place. Strip the trailing slash
// from the configured site URL and the leading-only-on-root from path so
// the result is e.g. https://ravy.pro/blogs (no double slash, no trailing).
// The root keeps its slash (https://ravy.pro/) — that's the canonical form
// of an origin and matches og:url on the home page.
const canonicalHref = computed(() => {
  const origin = seoData.mySite.replace(/\/+$/, '')
  const path = route.path === '/' ? '/' : route.path.replace(/\/+$/, '')
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
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-accent-600 focus:px-4 focus:py-2 focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-accent-500"
    >
      Skip to content
    </a>

    <MainHeader />

    <main id="main-content" class="pt-[var(--header-h)]">
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

/* Grid items refuse to shrink below their content's min-content width by
   default, so one long unbreakable string anywhere on a page widens <main>
   past the viewport and causes horizontal scroll on mobile. */
.gd-container > * {
  min-width: 0;
}
</style>
