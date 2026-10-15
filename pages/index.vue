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
  <div class="text-fg-muted">
    <MainHero />

    <!--
      Services lead the page: they are the commercial offer, so they sit directly
      under the hero and outside the container as a full-bleed band. Tools follow
      the writing further down — they're free self-serve utilities, valuable but
      not what the page is for.
    -->
    <MainServices />

    <LayoutContainer>
      <LazyMainRecent hydrate-on-visible />

      <!-- Newest TIL notes; renders nothing until the first one is published. -->
      <LazyMainTil hydrate-on-visible />

      <section class="py-14">
        <UiSectionHeader eyebrow="Utilities" title="Tools" to="/tools" link-label="All tools" />

        <!-- Two content tiers, two visual weights. Flagship products lead as
             rich cards (audience tag, full pitch, facts, verb CTA); quick
             utilities follow as a compact grab-and-go strip. -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UiCard
            v-for="tool in featuredTools"
            :key="tool.path"
            :to="tool.path"
            @click="trackCta(tool.path, 'home_tools')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 bg-panel-raised text-accent-ink border border-line">
                <Icon :name="tool.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <UiTag v-if="tool.tag" tone="accent">
                {{ tool.tag }}
              </UiTag>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p class="font-display font-extrabold uppercase text-3xl leading-none text-fg">
                {{ tool.name }}
              </p>
              <ToolRatingBadge :summary="ratingFor(tool.path)" />
            </div>

            <p class="mt-3 grow text-sm leading-relaxed text-fg-muted">
              {{ tool.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span v-if="tool.meta" class="font-spacemono text-micro text-fg-subtle">
                {{ tool.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
                {{ tool.action || 'Open' }}
                <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </UiCard>
        </div>

        <p class="mt-8 mb-3 font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle">
          Quick utilities
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UiCard
            v-for="tool in quickTools"
            :key="tool.path"
            :to="tool.path"
            cut="sm"
            padding="sm"
            @click="trackCta(tool.path, 'home_tools')"
          >
            <span class="flex items-center gap-3">
              <Icon :name="tool.icon" class="w-5 h-5 shrink-0 text-accent-ink" aria-hidden="true" />
              <span class="min-w-0 flex-1 font-semibold text-fg truncate">{{ tool.name }}</span>
            </span>
            <ToolRatingBadge :summary="ratingFor(tool.path)" class="mt-1.5" />
            <span class="mt-1.5 block text-xs leading-relaxed text-fg-muted line-clamp-2">{{ tool.blurb }}</span>
          </UiCard>
        </div>

        <!-- Suggest-a-tool: a slim full-width strip, not a fake tool card. -->
        <a
          :href="suggestToolUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="group mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border border-dashed border-line-strong px-5 py-4 transition-colors duration-200 hover:border-accent hover:bg-panel"
        >
          <span class="flex items-center gap-3.5 min-w-0">
            <span class="shrink-0 grid place-items-center w-9 h-9 border border-dashed border-line-strong text-fg-subtle transition-colors group-hover:border-accent group-hover:text-accent-ink">
              <Icon name="mdi:plus" class="w-5 h-5" aria-hidden="true" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold text-fg">Suggest a tool</span>
              <span class="block text-sm text-fg-muted">Tell me what to build. It might ship next.</span>
            </span>
          </span>
          <span class="inline-flex items-center gap-1.5 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
            <Icon name="fa:telegram" class="w-4 h-4" aria-hidden="true" />
            Telegram
            <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </a>
      </section>

      <!-- Games, music and animation: the creative side, after the tools and
           before the closing ask. -->
      <LazyMainProjects hydrate-on-visible />

      <!--
        The page's one closing ask, placed before Instagram so it isn't stranded
        behind a wall of photos. Distinct `location` from the Services band so the
        two can be compared — if this strip converts nothing, cut it.
      -->
      <section class="pt-4 pb-14">
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
           sits after the ask as a sign-off. Hydration waits until it scrolls
           into view — it's the last thing on the page and the heaviest in
           images, so it has no business competing with the hero. -->
      <LazyMainInstagram hydrate-on-visible />
    </LayoutContainer>
  </div>
</template>
