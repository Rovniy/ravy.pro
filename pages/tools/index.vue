<script setup lang="ts">
import { publicServices, toolsPage } from '~/data'
import { toolIdFromPath } from '~/data/analytics'

// The hub for /tools/*. Three things made this page necessary rather than nice:
// every tool page's BreadcrumbList named `/tools` as its parent and that URL
// returned 404; the tools had no landing page of their own (the home-page grid
// and a JS-rendered nav dropdown were the only routes in); and there was nowhere
// linking a tool to the post about building it.
//
// Layout deliberately mirrors the home-page Tools section (same two tiers, same
// card anatomy) so the two read as the same content, not two designs.
const title = toolsPage.meta.title
const description = toolsPage.meta.description

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
  ],
})

useToolsIndexSchema({
  title,
  description,
  items: publicServices.map(s => ({ path: s.path, name: s.name, description: s.blurb })),
})

defineOgImage('Blog', {
  headline: toolsPage.og.headline,
  title: toolsPage.og.title,
  description: toolsPage.og.description,
  link: toolsPage.og.link,
})

const { trackCta } = useAnalytics()

const { ratings, load: loadRatings } = useToolRatings()
onMounted(loadRatings)

const featuredTools = publicServices.filter(s => s.featured)
const quickTools = publicServices.filter(s => !s.featured)

function ratingFor(path: string) {
  const toolId = toolIdFromPath(path)
  return toolId ? ratings.value?.[toolId] ?? null : null
}

const suggestToolText = encodeURIComponent('Hi Andrei! I want to suggest a new tool for your public Tools page:')
const suggestToolUrl = `https://t.me/xploitravy?text=${suggestToolText}`
</script>

<template>
  <div class="text-slate-600 dark:text-slate-300">
    <section class="container max-w-5xl mx-auto px-6 py-14">
      <p class="eyebrow mb-2.5">
        {{ toolsPage.og.headline }}
      </p>
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ toolsPage.content.title }}
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-relaxed">
        {{ toolsPage.content.description }}
      </p>

      <!-- Flagship products lead as rich cards; quick utilities follow as a
           compact strip. Same split as the home page, declared by `featured`. -->
      <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="(tool, i) in featuredTools"
          :key="tool.path"
          v-reveal="i * 90"
          class="group relative flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
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
            <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              <NuxtLink :to="tool.path" class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors" @click="trackCta(tool.path, 'tools_index')">
                {{ tool.name }}
              </NuxtLink>
            </h2>
            <ToolRatingBadge :summary="ratingFor(tool.path)" />
          </div>

          <p class="mt-2 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ tool.blurb }}
          </p>

          <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span v-if="tool.meta" class="font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
              {{ tool.meta }}
            </span>
            <NuxtLink
              :to="tool.path"
              class="inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400"
              @click="trackCta(tool.path, 'tools_index')"
            >
              {{ tool.action || 'Open' }}
              <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </NuxtLink>
          </div>

          <!-- The tool ↔ post pair, declared once in `publicServices.story`. -->
          <NuxtLink
            v-if="tool.story"
            :to="tool.story"
            class="mt-3 inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          >
            <Icon name="mdi:notebook-outline" class="w-3.5 h-3.5" aria-hidden="true" />
            How and why I built this
          </NuxtLink>
        </div>
      </div>

      <p class="eyebrow mt-8 mb-3">
        Quick utilities
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          v-for="(tool, i) in quickTools"
          :key="tool.path"
          v-reveal="(i % 4) * 70"
          class="group relative flex items-start gap-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10"
        >
          <span class="shrink-0 grid place-items-center w-10 h-10 rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-950/50 dark:text-accent-400 dark:ring-accent-900/60 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
            <Icon :name="tool.icon" class="w-5 h-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <h2 class="font-semibold text-slate-900 dark:text-slate-100 truncate">
                <NuxtLink :to="tool.path" class="hover:text-accent-600 dark:hover:text-accent-400 transition-colors" @click="trackCta(tool.path, 'tools_index')">
                  {{ tool.name }}
                </NuxtLink>
              </h2>
              <Icon name="mdi:arrow-right" class="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-accent-500 transition-all duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
            <ToolRatingBadge :summary="ratingFor(tool.path)" class="mt-0.5" />
            <span class="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">{{ tool.blurb }}</span>
            <NuxtLink
              v-if="tool.story"
              :to="tool.story"
              class="mt-2 inline-flex items-center gap-1.5 font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            >
              <Icon name="mdi:notebook-outline" class="w-3 h-3" aria-hidden="true" />
              The write-up
            </NuxtLink>
          </span>
        </div>
      </div>

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

      <p class="mt-10 text-sm text-slate-500 dark:text-slate-400">
        Need something built rather than something to use?
        <NuxtLink to="/services" class="text-accent-600 dark:text-accent-400 underline underline-offset-2 hover:no-underline">
          See what I do for teams
        </NuxtLink>, or read
        <NuxtLink to="/blogs" class="text-accent-600 dark:text-accent-400 underline underline-offset-2 hover:no-underline">
          the engineering blog
        </NuxtLink>.
      </p>
    </section>
  </div>
</template>
