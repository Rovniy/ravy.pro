<script setup lang="ts">
import { TINY_BOO_MOVIE } from '~/data/animation'
import { gamePath, GAMES } from '~/data/games'
import { MUSIC_PROJECTS, musicPath } from '~/data/music'
import { HUB_COPY } from '~/data/projects'

const copy = HUB_COPY.projects

// Open source lives on GitHub and npm, not in a registry of its own: three
// entries, each with its page under /tools.
const openSource = [
  {
    name: 'XPLOIT Game UI',
    to: '/tools/xploit-game-ui',
    text: 'A Unity plugin that renders game UI written in HTML, CSS and JavaScript on the GPU. Apache-2.0.',
    icon: 'mdi:unity',
  },
  {
    name: 'XPLOIT Translator',
    to: '/tools/xploit-translator',
    text: 'A Windows tray app: copy text or a screenshot, press a hotkey, read the translation.',
    icon: 'mdi:translate',
  },
  {
    name: 'tabs-broadcast',
    to: '/tools/tabs-broadcast',
    text: 'A small npm library for messaging between browser tabs, built for high-load interfaces.',
    icon: 'mdi:tab',
  },
]

useProjectHubSchema({
  path: '/projects',
  name: copy.heading,
  title: copy.title,
  description: copy.description,
  items: [
    { path: '/games', name: 'Games' },
    ...GAMES.map(g => ({ path: gamePath(g), name: g.title })),
    { path: '/music', name: 'Music' },
    ...MUSIC_PROJECTS.map(p => ({ path: musicPath(p), name: p.name })),
    { path: TINY_BOO_MOVIE.path, name: TINY_BOO_MOVIE.title },
  ],
})

const { trackCta } = useAnalytics()
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <header class="max-w-3xl">
      <span class="eyebrow">Creative work</span>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
        {{ copy.heading }}
      </h1>
      <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
        {{ copy.description }}
      </p>
    </header>

    <section class="mt-12">
      <UiSectionHeader eyebrow="XPLOIT" title="Games" to="/games" link-label="All games" />
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ProjectCard
          v-for="(game, i) in GAMES"
          :key="game.slug"
          v-reveal="(i % 3) * 90"
          :to="gamePath(game)"
          :title="game.title"
          :tagline="game.tagline"
          :image="game.cover.src"
          :image-alt="game.cover.alt"
          :kicker="game.genre"
          :meta="game.platforms.join(' · ')"
          @click="trackCta(gamePath(game), 'projects_hub')"
        >
          <template #badge>
            <ProjectStatusChip :status="game.status" />
          </template>
        </ProjectCard>
      </div>
    </section>

    <section class="mt-14">
      <UiSectionHeader eyebrow="AI music" title="Music" to="/music" link-label="All music" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ProjectCard
          v-for="(project, i) in MUSIC_PROJECTS"
          :key="project.slug"
          v-reveal="i * 90"
          :to="musicPath(project)"
          :title="project.name"
          :tagline="project.tagline"
          :image="project.hero.src"
          :image-alt="project.hero.alt"
          :kicker="project.genres.join(' · ')"
          @click="trackCta(musicPath(project), 'projects_hub')"
        />
      </div>
    </section>

    <section class="mt-14">
      <UiSectionHeader eyebrow="AI animation" title="Animation" />
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ProjectCard
          v-reveal
          :to="TINY_BOO_MOVIE.path"
          :title="TINY_BOO_MOVIE.title"
          :tagline="TINY_BOO_MOVIE.tagline"
          :image="TINY_BOO_MOVIE.hero.src"
          :image-alt="TINY_BOO_MOVIE.hero.alt"
          kicker="YouTube series"
          :meta="`${TINY_BOO_MOVIE.episodes.length} episodes and counting`"
          @click="trackCta(TINY_BOO_MOVIE.path, 'projects_hub')"
        />
      </div>
    </section>

    <section class="mt-14">
      <UiSectionHeader eyebrow="Code" title="Open source" />
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NuxtLink
          v-for="item in openSource"
          :key="item.name"
          :to="item.to"
          class="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition hover:border-accent-400 dark:hover:border-accent-600"
        >
          <Icon :name="item.icon" class="w-5 h-5 text-accent-500" aria-hidden="true" />
          <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-accent-600 dark:group-hover:text-accent-400">
            {{ item.name }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ item.text }}
          </p>
        </NuxtLink>
      </div>
      <p class="mt-4 text-sm">
        <a href="https://github.com/Rovniy" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-accent-500">
          <Icon name="fa:github" class="w-4 h-4" aria-hidden="true" /> More on GitHub
        </a>
      </p>
    </section>
  </div>
</template>
