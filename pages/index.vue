<script lang="ts" setup>
import { homePage, navbarData, publicServices } from '~/data'

const siteUrl = 'https://ravy.pro'
const title = homePage.meta.title
const description = homePage.meta.description
const suggestToolText = encodeURIComponent('Hi Andrei! I want to suggest a new tool for your public Tools page:')
const suggestToolUrl = `https://t.me/xploitravy?text=${suggestToolText}`

useHead({
  title,
  link: [
    { rel: 'canonical', href: `${siteUrl}/` },
  ],
  meta: [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { name: 'keywords', content: 'Andrei Rovnyi, engineering blog, web tools, QR code generator, software development' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/` },
    { property: 'og:image', content: `${siteUrl}/open_graph/og_image_default.png` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: `${siteUrl}/open_graph/og_image_default.png` },
  ],
})

useHomeSchema({
  name: navbarData.homeTitle,
  description,
})

defineOgImage('Blog', {
  headline: homePage.og.headline,
  title: homePage.og.title,
  description: homePage.og.description,
  link: homePage.og.link,
})
</script>

<template>
  <main class="text-slate-600">
    <MainHero />
    <div class="container max-w-5xl mx-auto">
      <section class="px-4 sm:px-0 mt-8 sm:mt-10">
        <div class="rounded-lg border border-slate-200 dark:border-slate-800 p-5 sm:p-6 bg-white dark:bg-slate-900">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p class="eyebrow mb-2">
                Utilities
              </p>
              <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Tools
              </h2>
              <p class="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Public tools available for everyone.
              </p>
            </div>
            <a
              :href="suggestToolUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm sm:text-base text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Icon name="fa:telegram" class="w-4 h-4" />
              Suggest a Tool
            </a>
          </div>

          <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NuxtLink
              v-for="service in publicServices"
              :key="service.path"
              :to="service.path"
              class="rounded-md border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <p class="text-base font-semibold text-slate-900 dark:text-slate-100">
                {{ service.name }}
              </p>
              <p class="mt-1 font-spacemono text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Open tool →
              </p>
            </NuxtLink>
          </div>
        </div>
      </section>
      <LazyMainRecent />
      <LazyMainInstagram />
      <LazyMainTrending />
    </div>
  </main>
</template>
