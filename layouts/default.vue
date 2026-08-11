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
  // og:url/twitter:url are derived from the same canonical as the link above,
  // for the same reason it lives here: one definition, every page. They used to
  // come from a hardcoded string in `siteMetaData`, so /about, /blogs,
  // /categories, /contacts, /links and every /docs page all advertised
  // `og:url = https://ravy.pro` — sharing any of them pointed at the home page.
  // Pages that set their own og:url (posts, tools, services) still win; unhead
  // dedupes by property and the page-level entry is registered later.
  meta: [
    { property: 'og:url', content: canonicalHref },
    { name: 'twitter:url', content: canonicalHref },
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

    <!--
      `hydrate-on-visible` is what actually defers this. The `Lazy` prefix alone
      only makes it a dynamic import — without a hydration trigger the chunk is
      still modulepreloaded and hydrated with everything else. The footer is
      below the fold on every page, and it still renders server-side, so the
      links stay in the HTML for crawlers either way.
    -->
    <LazyMainFooter hydrate-on-visible />

    <!--
      Floating theme switch, bottom-left. Out of the header so navigation is the
      only thing there, but present on every page. `z-40` keeps it under the
      cookie banner (z-50) — on a first visit the banner simply covers it, and
      once consent is decided the banner never returns.
      The ClientOnly fallback inside UiThemeToggle renders the same circle during
      SSR, so nothing shifts when colour mode resolves on the client.
    -->
    <!--
      On mobile the circle shrinks to 32px and tucks closer to the corner, but the
      `after:-inset-1.5` pseudo-element keeps the tappable area at 44px — the
      control gets visually smaller without becoming harder to hit, which is the
      opposite trade-off to simply scaling it down.
    -->
    <UiThemeToggle
      icon-size="18"
      class="theme-fab fixed bottom-3 left-3 sm:bottom-6 sm:left-6 z-40 print:hidden inline-flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-slate-200/70 dark:border-white/10 bg-white/70 dark:bg-slate-950/70 sm:bg-white/80 sm:dark:bg-slate-950/80 backdrop-blur-xl shadow-md sm:shadow-lg shadow-slate-950/5 dark:shadow-black/20 hover:border-accent-400 dark:hover:border-accent-500/60 after:content-[''] after:absolute after:-inset-1.5 sm:after:hidden"
    />

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

<!--
  Unscoped on purpose: UiThemeToggle sets `inheritAttrs: false` and re-binds
  $attrs onto its button, so the scoped-style data attribute never reaches it and
  a `:deep()` rule can't match. `.theme-fab` exists on exactly one element, so a
  global selector is safe here. Same pattern as the unscoped blocks in
  components/main/header.vue and tools-menu.vue.
-->
<style>
/* The icon size is a prop that lands as an inline font-size, so it can't be made
   responsive from the template — hence !important to beat it. Only mobile is
   overridden: the prop still carries the desktop size, so if this rule ever
   stops applying, desktop is untouched and only mobile grows back. */
@media (max-width: 639px) {
  .theme-fab .iconify {
    font-size: 16px !important;
  }
}
</style>
