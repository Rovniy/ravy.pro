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
  <div class="text-fg-muted">
    <section class="container max-w-5xl mx-auto px-6 py-14">
      <p class="eyebrow mb-2.5">
        {{ toolsPage.og.headline }}
      </p>
      <h1 class="text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
        {{ toolsPage.content.title }}
      </h1>
      <p class="mt-4 max-w-2xl text-base leading-relaxed">
        {{ toolsPage.content.description }}
      </p>

      <!-- Flagship products lead as rich cards; quick utilities follow as a
           compact strip. Same split as the home page, declared by `featured`. -->
      <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          v-for="tool in featuredTools"
          :key="tool.path"
          class="group relative flex flex-col border border-line bg-panel p-6 transition-all duration-200 hover:border-accent"
        >
          <div class="flex items-start justify-between gap-4">
            <span class="grid place-items-center w-12 h-12 bg-panel-raised text-accent-ink border border-line transition-transform duration-300 ease-expo">
              <Icon :name="tool.icon" class="w-6 h-6" aria-hidden="true" />
            </span>
            <span
              v-if="tool.tag"
              class="mt-0.5 shrink-0 border border-line px-2.5 py-1 font-spacemono text-micro uppercase tracking-wider text-fg-muted"
            >
              {{ tool.tag }}
            </span>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 class="text-lg font-bold tracking-tight text-fg">
              <NuxtLink :to="tool.path" class="hover:text-accent-ink transition-colors" @click="trackCta(tool.path, 'tools_index')">
                {{ tool.name }}
              </NuxtLink>
            </h2>
            <ToolRatingBadge :summary="ratingFor(tool.path)" />
          </div>

          <p class="mt-2 grow text-sm leading-relaxed text-fg-muted">
            {{ tool.blurb }}
          </p>

          <div class="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span v-if="tool.meta" class="font-spacemono text-micro text-fg-muted">
              {{ tool.meta }}
            </span>
            <NuxtLink
              :to="tool.path"
              class="inline-flex items-center gap-1 font-spacemono text-micro uppercase tracking-wider text-accent-ink"
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
            class="mt-3 inline-flex items-center gap-1.5 font-spacemono text-micro uppercase tracking-wider text-fg-muted hover:text-accent-ink transition-colors"
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
          v-for="tool in quickTools"
          :key="tool.path"
          class="group relative flex items-start gap-3.5 border border-line bg-panel p-4 transition-all duration-200 hover:border-accent"
        >
          <span class="shrink-0 grid place-items-center w-10 h-10 bg-panel-raised text-accent-ink border border-line transition-transform duration-300 ease-expo">
            <Icon :name="tool.icon" class="w-5 h-5" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="flex items-center justify-between gap-2">
              <h2 class="font-semibold text-fg truncate">
                <NuxtLink :to="tool.path" class="hover:text-accent-ink transition-colors" @click="trackCta(tool.path, 'tools_index')">
                  {{ tool.name }}
                </NuxtLink>
              </h2>
              <Icon name="mdi:arrow-right" class="w-4 h-4 shrink-0 text-line-strong group-hover:text-accent-500 transition-all duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
            <ToolRatingBadge :summary="ratingFor(tool.path)" class="mt-0.5" />
            <span class="mt-1 block text-xs leading-relaxed text-fg-muted">{{ tool.blurb }}</span>
            <NuxtLink
              v-if="tool.story"
              :to="tool.story"
              class="mt-2 inline-flex items-center gap-1.5 font-spacemono text-micro uppercase tracking-wider text-fg-muted hover:text-accent-ink transition-colors"
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
        class="group mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border border-dashed border-line-strong px-5 py-4 transition-all duration-200 hover:border-accent hover:bg-white/70 dark:hover:bg-slate-800/40"
      >
        <span class="flex items-center gap-3.5 min-w-0">
          <span class="shrink-0 grid place-items-center w-9 h-9 border border-dashed border-line-strong text-slate-400 transition-all duration-300 ease-expo group-hover:border-accent-400 group-hover:text-accent-500">
            <Icon name="mdi:plus" class="w-5 h-5" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block font-semibold text-fg">Suggest a tool</span>
            <span class="block text-sm text-fg-muted">Tell me what to build — it might ship next</span>
          </span>
        </span>
        <span class="inline-flex items-center gap-1.5 font-spacemono text-micro uppercase tracking-wider text-accent-ink">
          <Icon name="fa:telegram" class="w-3.5 h-3.5" aria-hidden="true" />
          Telegram
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </span>
      </a>

      <p class="mt-10 text-sm text-fg-muted">
        Need something built rather than something to use?
        <NuxtLink to="/services" class="text-accent-ink underline underline-offset-2 hover:no-underline">
          See what I do for teams
        </NuxtLink>, or read
        <NuxtLink to="/blogs" class="text-accent-ink underline underline-offset-2 hover:no-underline">
          the engineering blog
        </NuxtLink>.
      </p>
    </section>
  </div>
</template>
