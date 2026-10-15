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
  <div class="px-6 lg:px-10 py-8 sm:py-12 mx-auto w-full max-w-6xl">
    <header>
      <NuxtLink to="/projects" class="eyebrow hover:text-accent-500 transition-colors">
        Projects
      </NuxtLink>
      <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
        {{ copy.heading }}
      </h1>
      <p class="mt-3 text-base sm:text-lg text-fg-muted leading-relaxed">
        {{ copy.description }}
      </p>
    </header>

    <div class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
      <ProjectCard
        v-for="game in GAMES"
        :key="game.slug"
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

    <p class="mt-10 text-sm text-fg-muted">
      All of these are made at <a href="https://xploit.games" class="underline decoration-line-strong hover:text-accent-500">XPLOIT</a>, the independent game studio I founded.
    </p>
  </div>
</template>
