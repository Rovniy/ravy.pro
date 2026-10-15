<script setup lang="ts">
import { baseData, socialNetworks } from '~/data'

// Under every note and hub. A reader who arrives from a search result came for
// an answer, not for the author; this is the one place that says who gave it
// and what else he does.

const linkedin = socialNetworks.find(s => s.name === 'LinkedIn')
const { trackCta } = useAnalytics()
</script>

<template>
  <aside class="flex flex-col sm:flex-row gap-5 border border-line border-l-4 border-l-accent bg-panel p-5 sm:p-6" aria-label="About the author">
    <NuxtImg
      src="/photos/a_rovnyi_lumy.webp"
      :alt="baseData.me.name"
      width="72"
      height="72"
      densities="x1 x2"
      class="w-18 h-18 shrink-0 object-cover ring-1 ring-line"
      loading="lazy"
    />
    <div class="min-w-0">
      <p class="eyebrow mb-1">
        Written by
      </p>
      <p class="text-lg font-bold text-fg">
        {{ baseData.me.name }}
      </p>
      <p class="mt-1 text-sm leading-relaxed text-fg-muted">
        Engineering leader and founder of the game studio XPLOIT. 15 years of building web platforms, game systems and AI tools. These notes are the small things learned along the way.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink
          to="/about"
          class="skew-box btn btn-primary btn-sm"
          @click="trackCta('til_author_about', 'til')"
        >
          About me
        </NuxtLink>
        <NuxtLink
          to="/services"
          class="skew-box btn btn-secondary btn-sm"
          @click="trackCta('til_author_services', 'til')"
        >
          Work with me
        </NuxtLink>
        <NuxtLink
          v-if="linkedin"
          :to="linkedin.href"
          target="_blank"
          rel="noopener"
          class="skew-box btn btn-secondary btn-sm"
        >
          <Icon name="fa:linkedin" size="14" aria-hidden="true" />
          Follow
        </NuxtLink>
        <a
          href="/til/rss.xml"
          class="skew-box btn btn-secondary btn-sm"
        >
          <Icon name="mdi:rss" size="14" aria-hidden="true" />
          RSS
        </a>
      </div>
    </div>
  </aside>
</template>
