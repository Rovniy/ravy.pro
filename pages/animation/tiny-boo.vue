<script setup lang="ts">
import { EVENTS } from '~/data/analytics'
import { TINY_BOO_MOVIE as s } from '~/data/animation'
import { youtubeThumb } from '~/data/projects'

useSeriesPageSchema(s)

const { trackCta } = useAnalytics()
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div class="lg:col-span-3 min-w-0">
        <NuxtLink to="/projects" class="eyebrow hover:text-accent-500 transition-colors">
          Projects · Animation
        </NuxtLink>
        <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
          {{ s.title }}
        </h1>
        <p class="mt-3 text-lg text-fg leading-relaxed">
          {{ s.tagline }}
        </p>
        <p class="mt-3 text-base text-fg-muted leading-relaxed">
          {{ s.description }}
        </p>
        <div class="mt-6 flex flex-wrap items-center gap-3">
          <a
            :href="s.channelUrl"
            target="_blank"
            rel="noopener"
            class="skew-box btn btn-primary"
            @click="trackCta(s.channelUrl, 'animation_hero')"
          >
            <Icon name="simple-icons:youtube" class="w-5 h-5" aria-hidden="true" />
            Watch on YouTube
            <Icon name="mdi:open-in-new" class="w-4 h-4 opacity-60" aria-hidden="true" />
          </a>
          <NuxtLink
            :to="s.game"
            class="skew-box btn btn-secondary"
          >
            <Icon name="mdi:gamepad-variant-outline" class="w-5 h-5" aria-hidden="true" />
            The game
          </NuxtLink>
        </div>
      </div>
      <div class="lg:col-span-2">
        <img
          :src="s.hero.src"
          :alt="s.hero.alt"
          class="w-full aspect-video object-cover border border-line bg-slate-800"
          decoding="async"
        >
      </div>
    </header>

    <!-- Episodes -->
    <section class="mt-14">
      <span class="eyebrow">{{ s.season.name }}</span>
      <p class="mt-3 text-fg-muted leading-relaxed">
        {{ s.season.text }}
      </p>
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="ep in s.episodes" :key="ep.youtubeId">
          <UiEmbedFacade
            :src="`https://www.youtube-nocookie.com/embed/${ep.youtubeId}`"
            :title="`${ep.code}: ${ep.title}`"
            :poster="youtubeThumb(ep.youtubeId)"
            :poster-alt="`${ep.title} thumbnail`"
            :event="EVENTS.VIDEO_PLAY"
            :event-params="{ project: s.slug, item: ep.code }"
          />
          <p class="mt-2 text-sm text-fg-muted">
            {{ ep.logline }}
          </p>
        </div>
      </div>
      <p class="mt-6 text-sm">
        <a :href="s.channelUrl" target="_blank" rel="noopener" class="text-accent-ink hover:underline">
          All episodes and Shorts on the channel →
        </a>
      </p>
    </section>

    <!-- Decisions -->
    <section class="mt-14">
      <span class="eyebrow">How it is made</span>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="d in s.decisions"
          :key="d.title"
          class="border border-line bg-panel p-5"
        >
          <h3 class="font-semibold text-fg">
            {{ d.title }}
          </h3>
          <p class="mt-1 text-sm text-fg-muted leading-relaxed">
            {{ d.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Character sheet -->
    <section class="mt-14">
      <span class="eyebrow">The character lock</span>
      <img
        :src="s.characterSheet.src"
        :alt="s.characterSheet.alt"
        :width="s.characterSheet.width"
        :height="s.characterSheet.height"
        class="mt-4 w-full h-auto border border-line"
        loading="lazy"
        decoding="async"
      >
    </section>

    <!-- Pipeline -->
    <section class="mt-14">
      <span class="eyebrow">Production pipeline</span>
      <ol class="mt-4 space-y-3">
        <li
          v-for="(step, i) in s.pipeline"
          :key="step.name"
          class="flex gap-4 border border-line p-5"
        >
          <span class="font-spacemono text-sm text-accent-500 shrink-0">0{{ i + 1 }}</span>
          <div class="min-w-0">
            <h3 class="font-semibold text-fg">
              {{ step.name }}
            </h3>
            <p class="mt-1 text-sm text-fg-muted leading-relaxed">
              {{ step.text }}
            </p>
          </div>
        </li>
      </ol>
      <div class="mt-5 flex flex-wrap gap-2">
        <span
          v-for="tool in s.tools"
          :key="tool"
          class="border border-line px-2.5 py-1 font-spacemono text-micro text-fg-muted"
        >{{ tool }}</span>
      </div>
    </section>

    <ProjectRelatedPosts :tag="s.blogTag" title="Behind the scenes" />
  </div>
</template>
