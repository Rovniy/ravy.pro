<script setup lang="ts">
import { EVENTS } from '~/data/analytics'
import { gameBySlug } from '~/data/games'
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
        <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          {{ game.title }}
        </h1>
        <p class="mt-3 text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
          {{ game.tagline }}
        </p>
        <p class="mt-3 text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          {{ game.description }}
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          <ProjectStatusChip :status="game.status" />
          <span class="eyebrow">{{ releaseLine }}</span>
        </div>
        <ProjectLinkButtons class="mt-6" :links="game.links" :project="game.slug" />
        <p v-if="!game.links.length && game.blogPath" class="mt-6 text-sm text-slate-500 dark:text-slate-400">
          No store page yet. Follow the build in the <NuxtLink :to="game.blogPath" class="underline hover:text-accent-500">
            devlog
          </NuxtLink>.
        </p>
      </div>
      <div class="lg:col-span-2">
        <img
          :src="game.cover.src"
          :alt="game.cover.alt"
          class="w-full aspect-video object-cover rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-800"
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

    <!-- My role -->
    <section v-if="game.role.length" class="mt-14">
      <span class="eyebrow">What I built</span>
      <div class="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <ul class="space-y-3">
          <li v-for="line in game.role" :key="line" class="flex gap-3 text-slate-700 dark:text-slate-200 leading-relaxed">
            <Icon name="mdi:check" class="w-5 h-5 mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{{ line }}</span>
          </li>
        </ul>
        <div v-if="game.stack.length" class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          <span
            v-for="tech in game.stack"
            :key="tech"
            class="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-spacemono text-[11px] text-slate-600 dark:text-slate-300"
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
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">
            {{ f.title }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ f.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Facts -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8">
      <span class="eyebrow">Facts</span>
      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div v-for="fact in game.facts" :key="fact.label">
          <dt class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {{ fact.label }}
          </dt>
          <dd class="mt-1 text-slate-800 dark:text-slate-200">
            {{ fact.value }}
          </dd>
        </div>
      </dl>
      <p v-if="game.privacyPolicyPath" class="mt-6 text-sm">
        <NuxtLink :to="game.privacyPolicyPath" class="text-slate-500 dark:text-slate-400 underline hover:text-accent-500">
          Privacy policy
        </NuxtLink>
      </p>
    </section>

    <ProjectRelatedPosts :tag="game.blogTag" :paths="game.blogPath ? [game.blogPath] : []" />

    <div class="mt-14">
      <NuxtLink to="/games" class="inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-accent-500">
        <Icon name="mdi:arrow-left" class="w-4 h-4" aria-hidden="true" /> All games
      </NuxtLink>
    </div>
  </div>
</template>
