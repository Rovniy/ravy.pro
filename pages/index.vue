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
      <section class="py-14 px-6">
        <div class="flex items-center gap-3 mb-8">
          <Icon name="mdi:toolbox-outline" size="1.4em" aria-hidden="true" class="text-slate-400 dark:text-slate-500" />
          <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
            Tools
          </h2>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="service in publicServices"
            :key="service.path"
            :to="service.path"
            class="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-sm"
          >
            <span class="grid place-items-center w-10 h-10 rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-950/50 dark:text-sky-400 dark:ring-sky-900/60">
              <Icon :name="service.icon || 'mdi:tools'" class="w-5 h-5" aria-hidden="true" />
            </span>
            <p class="mt-4 font-semibold text-slate-900 dark:text-slate-100">
              {{ service.name }}
            </p>
            <p class="mt-1 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ service.blurb }}
            </p>
            <span class="mt-4 inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Open
              <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </NuxtLink>

          <a
            :href="suggestToolUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex flex-col justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 text-center transition-colors hover:border-sky-400 hover:bg-slate-50 dark:hover:border-sky-500 dark:hover:bg-slate-800/40"
          >
            <span class="mx-auto grid place-items-center w-10 h-10 rounded-lg border border-slate-300 text-slate-400 transition-colors group-hover:border-sky-400 group-hover:text-sky-500 dark:border-slate-700">
              <Icon name="mdi:plus" class="w-5 h-5" aria-hidden="true" />
            </span>
            <p class="mt-4 font-semibold text-slate-900 dark:text-slate-100">
              Suggest a tool
            </p>
            <p class="mt-1 inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Icon name="fa:telegram" class="w-3.5 h-3.5" aria-hidden="true" />
              Tell me what to build
            </p>
          </a>
        </div>
      </section>
      <LazyMainRecent />
      <LazyMainInstagram />
      <LazyMainTrending />
    </div>
  </main>
</template>
