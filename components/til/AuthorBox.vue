<script setup lang="ts">
import { baseData, socialNetworks } from '~/data'

// Under every note and hub. A reader who arrives from a search result came for
// an answer, not for the author; this is the one place that says who gave it
// and what else he does.

const linkedin = socialNetworks.find(s => s.name === 'LinkedIn')
const { trackCta } = useAnalytics()
</script>

<template>
  <aside class="flex flex-col sm:flex-row gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-accent-500/[0.06] to-emerald-500/[0.04] p-5 sm:p-6" aria-label="About the author">
    <NuxtImg
      src="/photos/a_rovnyi_lumy.webp"
      :alt="baseData.me.name"
      width="72"
      height="72"
      densities="x1 x2"
      class="w-18 h-18 shrink-0 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
      loading="lazy"
    />
    <div class="min-w-0">
      <p class="eyebrow mb-1">
        Written by
      </p>
      <p class="text-lg font-bold text-slate-900 dark:text-slate-100">
        {{ baseData.me.name }}
      </p>
      <p class="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Engineering leader and founder of the game studio XPLOIT. 15 years of building web platforms, game systems and AI tools. These notes are the small things learned along the way.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink
          to="/about"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 dark:text-slate-950 dark:bg-accent-400 dark:hover:bg-accent-300 transition-colors"
          @click="trackCta('til_author_about', 'til')"
        >
          About me
        </NuxtLink>
        <NuxtLink
          to="/services"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-accent-500/50 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          @click="trackCta('til_author_services', 'til')"
        >
          Work with me
        </NuxtLink>
        <NuxtLink
          v-if="linkedin"
          :to="linkedin.href"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-accent-500/50 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <Icon name="fa:linkedin" size="14" aria-hidden="true" />
          Follow
        </NuxtLink>
        <a
          href="/til/rss.xml"
          class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-accent-500/50 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <Icon name="mdi:rss" size="14" aria-hidden="true" />
          RSS
        </a>
      </div>
    </div>
  </aside>
</template>
