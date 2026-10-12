<script setup lang="ts">
import { gamePath, GAMES } from '~/data/games'
import { HUB_COPY } from '~/data/projects'

const copy = HUB_COPY.games

useProjectHubSchema({
  path: '/games',
  name: copy.heading,
  title: copy.title,
  description: copy.description,
  image: GAMES[0]!.cover.src,
  items: GAMES.map(g => ({ path: gamePath(g), name: g.title })),
})

const { trackCta } = useAnalytics()
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <header class="max-w-3xl">
      <NuxtLink to="/projects" class="eyebrow hover:text-accent-500 transition-colors">
        Projects
      </NuxtLink>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
        {{ copy.heading }}
      </h1>
      <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
        {{ copy.description }}
      </p>
    </header>

    <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      <ProjectCard
        v-for="(game, i) in GAMES"
        :key="game.slug"
        v-reveal="(i % 2) * 90"
        :to="gamePath(game)"
        :title="game.title"
        :tagline="game.tagline"
        :image="game.cover.src"
        :image-alt="game.cover.alt"
        :kicker="game.genre"
        :meta="game.platforms.join(' · ')"
        @click="trackCta(gamePath(game), 'games_hub')"
      >
        <template #badge>
          <ProjectStatusChip :status="game.status" />
        </template>
      </ProjectCard>
    </div>

    <p class="mt-10 text-sm text-slate-500 dark:text-slate-400">
      All of these are made at <a href="https://xploit.games" class="underline decoration-slate-400/40 hover:text-accent-500">XPLOIT</a>, the independent game studio I founded.
    </p>
  </div>
</template>
