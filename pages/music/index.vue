<script setup lang="ts">
import { MUSIC_PROJECTS, musicPath, trackTotal } from '~/data/music'
import { HUB_COPY } from '~/data/projects'

const copy = HUB_COPY.music

useProjectHubSchema({
  path: '/music',
  name: copy.heading,
  title: copy.title,
  description: copy.description,
  image: MUSIC_PROJECTS[0]!.hero.src,
  items: MUSIC_PROJECTS.map(p => ({ path: musicPath(p), name: p.name })),
})

function meta(slug: string) {
  const p = MUSIC_PROJECTS.find(x => x.slug === slug)!
  const albums = `${p.releases.length} ${p.releases.length === 1 ? 'album' : 'albums'}`
  const tracks = trackTotal(p)
  return tracks ? `${albums} · ${tracks} tracks` : albums
}

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
        v-for="(project, i) in MUSIC_PROJECTS"
        :key="project.slug"
        v-reveal="i * 90"
        :to="musicPath(project)"
        :title="project.name"
        :tagline="project.tagline"
        :image="project.hero.src"
        :image-alt="project.hero.alt"
        :kicker="project.genres.join(' · ')"
        :meta="meta(project.slug)"
        @click="trackCta(musicPath(project), 'music_hub')"
      />
    </div>

    <section class="mt-14 max-w-3xl">
      <span class="eyebrow">How it is made</span>
      <p class="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
        Both projects are made with generative AI, and I say so openly. I write the concepts and the stories, direct the sound, and pick, edit and release every track myself.
        <NuxtLink to="/blogs/how-i-started-making-music-with-ai" class="underline decoration-slate-400/40 hover:text-accent-500">
          How I started making music with AI
        </NuxtLink>.
      </p>
    </section>
  </div>
</template>
