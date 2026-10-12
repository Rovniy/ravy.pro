<script setup lang="ts">
import { TINY_BOO_MOVIE } from '~/data/animation'
import { gamePath, GAMES } from '~/data/games'
import { MUSIC_PROJECTS, musicPath } from '~/data/music'

// One of each kind on the home page: the flagship game, a music project and the
// series. The full lists are one click away on /projects.
const game = GAMES[0]!
const music = MUSIC_PROJECTS[0]!

const cards = [
  { to: gamePath(game), title: game.title, tagline: game.tagline, image: game.cover.src, alt: game.cover.alt, kicker: 'Game', meta: game.platforms.join(' · ') },
  { to: musicPath(music), title: music.name, tagline: music.tagline, image: music.hero.src, alt: music.hero.alt, kicker: 'AI music', meta: music.genres.slice(0, 2).join(' · ') },
  { to: TINY_BOO_MOVIE.path, title: TINY_BOO_MOVIE.title, tagline: TINY_BOO_MOVIE.tagline, image: TINY_BOO_MOVIE.hero.src, alt: TINY_BOO_MOVIE.hero.alt, kicker: 'AI animation', meta: 'YouTube series' },
]

const { trackCta } = useAnalytics()
</script>

<template>
  <section class="py-14 px-6">
    <UiSectionHeader eyebrow="Creative work" title="Games, music & animation" to="/projects" link-label="All projects" />
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <ProjectCard
        v-for="(card, i) in cards"
        :key="card.to"
        v-reveal="i * 90"
        :to="card.to"
        :title="card.title"
        :tagline="card.tagline"
        :image="card.image"
        :image-alt="card.alt"
        :kicker="card.kicker"
        :meta="card.meta"
        @click="trackCta(card.to, 'home_projects')"
      />
    </div>
  </section>
</template>
