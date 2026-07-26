<script lang="ts" setup>
import { homePage, navbarData, publicServices } from '~/data'
import { toolIdFromPath } from '~/data/analytics'

const siteUrl = 'https://ravy.pro'
const title = homePage.meta.title
const description = homePage.meta.description
const suggestToolText = encodeURIComponent('Hi Andrei! I want to suggest a new tool for your public Tools page:')
const suggestToolUrl = `https://t.me/xploitravy?text=${suggestToolText}`
// Telegram fallback on the closing CTA, for people who'd rather not use a form.
const suggestServiceText = encodeURIComponent('Hi Andrei! I\'d like to talk about working together. Here\'s what I need:')

useHead({
  title,
  // The home title already contains the site name — don't let the global
  // '%s - Andrei Rovnyi' template append it a second time.
  titleTemplate: '%s',
  meta: [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/` },
    // og:image / twitter:image come from defineOgImage('Blog', …) below.
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
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

const { trackCta } = useAnalytics()

const { ratings, load: loadRatings } = useToolRatings()
onMounted(loadRatings)

// Two content tiers: flagship products (rich cards) vs quick utilities
// (compact rows). The split is declared in data/index.ts via `featured`.
const featuredTools = publicServices.filter(s => s.featured)
const quickTools = publicServices.filter(s => !s.featured)

function ratingFor(path: string) {
  const toolId = toolIdFromPath(path)
  return toolId ? ratings.value?.[toolId] ?? null : null
}
</script>

<template>
  <div class="text-slate-600 dark:text-slate-300">
    <MainHero />

    <!--
      Services lead the page: they are the commercial offer, so they sit directly
      under the hero and outside the container as a full-bleed band. Tools follow
      the writing further down — they're free self-serve utilities, valuable but
      not what the page is for.
    -->
    <MainServices />

    <div class="container max-w-5xl mx-auto">
      <LazyMainRecent />

      <section class="py-14 px-6">
        <UiSectionHeader eyebrow="Utilities" title="Tools" />

        <!-- Two content tiers, two visual weights. Flagship products lead as
             rich cards (audience chip, full pitch, pricing facts, verb CTA);
             quick utilities follow as a compact grab-and-go strip. -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NuxtLink
            v-for="(tool, i) in featuredTools"
            :key="tool.path"
            v-spotlight
            v-reveal="i * 90"
            :to="tool.path"
            class="group relative flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
            @click="trackCta(tool.path, 'home_tools')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-950/50 dark:text-accent-400 dark:ring-accent-900/60 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
                <Icon :name="tool.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <span
                v-if="tool.tag"
                class="mt-0.5 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                {{ tool.tag }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {{ tool.name }}
              </p>
              <ToolRatingBadge :summary="ratingFor(tool.path)" />
            </div>

            <p class="mt-2 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ tool.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span v-if="tool.meta" class="font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
                {{ tool.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
                {{ tool.action || 'Open' }}
                <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </NuxtLink>
        </div>

        <p class="eyebrow mt-8 mb-3">
          Quick utilities
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <NuxtLink
            v-for="(tool, i) in quickTools"
            :key="tool.path"
            v-spotlight
            v-reveal="(i % 4) * 70"
            :to="tool.path"
            class="group relative flex items-start gap-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
            @click="trackCta(tool.path, 'home_tools')"
          >
            <span class="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-950/50 dark:text-accent-400 dark:ring-accent-900/60 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
              <Icon :name="tool.icon" class="w-5 h-5" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center justify-between gap-2">
                <span class="font-semibold text-slate-900 dark:text-slate-100 truncate">{{ tool.name }}</span>
                <Icon name="mdi:arrow-right" class="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-accent-500 transition-all duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
              <ToolRatingBadge :summary="ratingFor(tool.path)" class="mt-0.5" />
              <span class="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">{{ tool.blurb }}</span>
            </span>
          </NuxtLink>
        </div>

        <!-- Suggest-a-tool: a slim full-width strip, not a fake tool card. -->
        <a
          v-reveal
          :href="suggestToolUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 px-5 py-4 transition-all duration-200 hover:border-accent-400 dark:hover:border-accent-500 hover:bg-white/70 dark:hover:bg-slate-800/40"
        >
          <span class="flex items-center gap-3.5 min-w-0">
            <span class="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 transition-all duration-300 ease-expo group-hover:border-accent-400 group-hover:text-accent-500 motion-safe:group-hover:rotate-90">
              <Icon name="mdi:plus" class="w-5 h-5" aria-hidden="true" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold text-slate-900 dark:text-slate-100">Suggest a tool</span>
              <span class="block text-sm text-slate-500 dark:text-slate-400">Tell me what to build — it might ship next</span>
            </span>
          </span>
          <span class="inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
            <Icon name="fa:telegram" class="w-3.5 h-3.5" aria-hidden="true" />
            Telegram
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </a>
      </section>

      <!--
        The page's one closing ask, placed before Instagram so it isn't stranded
        behind a wall of photos. Distinct `location` from the Services band so the
        two can be compared — if this strip converts nothing, cut it.
      -->
      <section class="pt-4 pb-14 px-6">
        <ServiceCtaBlock
          label="Something to build, review, or ship?"
          note="Tell me what you need and I'll reply within 24 hours — mentorship, consulting, or engineering help for your team."
          anchor="/services#inquiry"
          icon="mdi:arrow-right"
          :telegram-href="`https://t.me/xploitravy?text=${suggestServiceText}`"
          location="home_closing"
        />
      </section>

      <!-- Personality, not a section: every link here leaves the site, so it
           sits after the ask as a sign-off. -->
      <LazyMainInstagram />
    </div>
  </div>
</template>
