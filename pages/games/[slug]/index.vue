<script setup lang="ts">
import { EVENTS } from '~/data/analytics'
import { gameBySlug, gamePressPath } from '~/data/games'
import { releaseMonth, STATUS_LABEL } from '~/data/projects'

const route = useRoute()
const game = gameBySlug(String(route.params.slug))
if (!game)
  throw createError({ statusCode: 404, statusMessage: 'Game not found', fatal: true })

useGamePageSchema(game)

const releaseLine = computed(() => game.releaseDate
  ? `${STATUS_LABEL[game.status]} · ${releaseMonth(game.releaseDate)}`
  : STATUS_LABEL[game.status])
</script>

<template>
  <div v-if="game" class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div class="lg:col-span-3 min-w-0">
        <NuxtLink to="/games" class="eyebrow hover:text-accent-500 transition-colors">
          Games · {{ game.genre }}
        </NuxtLink>
        <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
          {{ game.title }}
        </h1>
        <p class="mt-3 text-lg text-fg leading-relaxed">
          {{ game.tagline }}
        </p>
        <p class="mt-3 text-base text-fg-muted leading-relaxed">
          {{ game.description }}
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <ProjectStatusChip :status="game.status" />
          <span class="eyebrow">{{ releaseLine }}</span>
        </div>
        <ProjectLinkButtons class="mt-6" :links="game.links" :project="game.slug" />
        <p v-if="!game.links.length && game.blogPath" class="mt-6 text-sm text-fg-muted">
          No store page yet. Follow the build in the <NuxtLink :to="game.blogPath" class="underline hover:text-accent-500">
            devlog
          </NuxtLink>.
        </p>
        <NuxtLink
          :to="gamePressPath(game)"
          class="mt-5 inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500"
        >
          <Icon name="mdi:newspaper-variant-outline" class="w-4 h-4" aria-hidden="true" /> Press kit
        </NuxtLink>
      </div>
      <div class="lg:col-span-2">
        <img
          :src="game.cover.src"
          :alt="game.cover.alt"
          class="w-full aspect-video object-cover border border-line bg-slate-800"
          decoding="async"
        >
      </div>
    </header>

    <!-- Trailer -->
    <section v-if="game.trailerYoutubeId" class="mt-12">
      <span class="eyebrow">Trailer</span>
      <div class="mt-4">
        <UiEmbedFacade
          :src="`https://www.youtube-nocookie.com/embed/${game.trailerYoutubeId}`"
          :title="`${game.title}: official trailer`"
          :poster="`https://i.ytimg.com/vi/${game.trailerYoutubeId}/hqdefault.jpg`"
          :poster-alt="`${game.title} trailer thumbnail`"
          :event="EVENTS.VIDEO_PLAY"
          :event-params="{ project: game.slug, item: 'trailer' }"
        />
      </div>
    </section>

    <!-- Steam Store -->
    <section v-if="game?.steam?.embed" class="mt-12">
      <span class="eyebrow">Steam store</span>
      <div class="mt-4">
        <!-- The page is `color-scheme: dark`; Chrome paints an opaque white canvas behind
             an iframe whose document is light-scheme. `normal` matches the widget, so the
             strip below its box stays transparent. -->
        <iframe
          :src="game.steam.embed"
          :title="`${game.title} on Steam`"
          width="100%"
          height="190"
          loading="lazy"
          class="block border-0"
          style="color-scheme: normal"
        />
      </div>
    </section>

    <!-- Screenshots -->
    <section v-if="game.screenshots?.length" class="mt-14">
      <span class="eyebrow">Screenshots</span>
      <ProjectGallery :images="game.screenshots" :title="game.title" />
    </section>

    <!-- My role -->
    <section v-if="game.role.length" class="mt-14">
      <span class="eyebrow">What I built</span>
      <div class="mt-4 border border-line bg-panel p-5 sm:p-6">
        <ul class="space-y-3">
          <li v-for="line in game.role" :key="line" class="flex gap-3 text-fg leading-relaxed">
            <Icon name="mdi:check" class="w-5 h-5 mt-0.5 shrink-0 text-ok" aria-hidden="true" />
            <span>{{ line }}</span>
          </li>
        </ul>
        <div v-if="game.stack.length" class="mt-5 pt-4 border-t border-line flex flex-wrap gap-2">
          <span
            v-for="tech in game.stack"
            :key="tech"
            class="border border-line px-2.5 py-1 font-spacemono text-micro text-fg-muted"
          >{{ tech }}</span>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="mt-14">
      <span class="eyebrow">The game</span>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="f in game.features"
          :key="f.title"
          class="border border-line bg-panel p-5"
        >
          <h3 class="font-semibold text-fg">
            {{ f.title }}
          </h3>
          <p class="mt-1 text-sm text-fg-muted leading-relaxed">
            {{ f.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Facts -->
    <section class="mt-14 border-t border-line pt-8">
      <span class="eyebrow">Facts</span>
      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div v-for="fact in game.facts" :key="fact.label">
          <dt class="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {{ fact.label }}
          </dt>
          <dd class="mt-1 text-fg">
            {{ fact.value }}
          </dd>
        </div>
      </dl>
      <p v-if="game.privacyPolicyPath" class="mt-6 text-sm">
        <NuxtLink :to="game.privacyPolicyPath" class="text-fg-muted underline hover:text-accent-500">
          Privacy policy
        </NuxtLink>
      </p>
    </section>

    <ProjectRelatedPosts :tag="game.blogTag" :paths="game.blogPath ? [game.blogPath] : []" />

    <div class="mt-14">
      <NuxtLink to="/games" class="inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500">
        <Icon name="mdi:arrow-left" class="w-4 h-4" aria-hidden="true" /> All games
      </NuxtLink>
    </div>
  </div>
</template>
