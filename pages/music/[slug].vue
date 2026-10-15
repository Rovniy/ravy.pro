<script setup lang="ts">
import type { Release } from '~/data/music'
import { EVENTS } from '~/data/analytics'
import { musicProjectBySlug, spotifyEmbedUrl, trackTotal } from '~/data/music'
import { platformLabel, releaseMonth } from '~/data/projects'

const route = useRoute()
const project = musicProjectBySlug(String(route.params.slug))
if (!project)
  throw createError({ statusCode: 404, statusMessage: 'Music project not found', fatal: true })

useMusicPageSchema(project)

// The player shows the newest release that has a Spotify album id, or the
// artist's top tracks when none does. Picking a release in the discography
// swaps it; the facade means nothing loads until someone presses play.
const playable = project.releases.filter(r => r.spotifyAlbumId)
const current = ref<Release | null>(playable[0] ?? null)
const playerKey = ref(0)

const player = computed(() => current.value?.spotifyAlbumId
  ? { src: spotifyEmbedUrl('album', current.value.spotifyAlbumId), title: `${project.name}: ${current.value.title} on Spotify`, poster: current.value.cover, item: current.value.title }
  : { src: spotifyEmbedUrl('artist', project.spotifyArtistId), title: `${project.name} on Spotify`, poster: project.hero.src, item: 'artist' })

function choose(release: Release) {
  if (!release.spotifyAlbumId)
    return
  current.value = release
  // A new key remounts the facade with the chosen album, already playing: the
  // "Play here" click is the visitor's consent to load it.
  playerKey.value++
  if (import.meta.client)
    document.getElementById('player')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const failedCovers = ref(new Set<string>())

// A long discography starts folded so the platforms and posts below stay in
// reach; the newest releases are the ones worth seeing first.
const FOLDED_COUNT = 6
const showAll = ref(project.releases.length <= FOLDED_COUNT)
const shownReleases = computed(() => showAll.value ? project.releases : project.releases.slice(0, FOLDED_COUNT))
const total = trackTotal(project)
</script>

<template>
  <div v-if="project" class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div class="lg:col-span-3 min-w-0">
        <NuxtLink to="/music" class="eyebrow hover:text-accent-500 transition-colors">
          Music · {{ project.genres.join(' · ') }}
        </NuxtLink>
        <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
          {{ project.name }}
        </h1>
        <p class="mt-3 text-lg text-fg leading-relaxed">
          {{ project.tagline }}
        </p>
        <p class="mt-3 italic text-fg-muted">
          “{{ project.motto }}”
        </p>
        <p class="mt-4 flex gap-2 border border-accent-200 dark:border-accent-900/60 bg-accent-50/60 dark:bg-accent-950/30 px-4 py-3 text-sm text-fg-muted leading-relaxed">
          <Icon name="mdi:robot-outline" class="w-5 h-5 shrink-0 text-accent-500" aria-hidden="true" />
          <span>{{ project.aiDisclosure }}</span>
        </p>
        <ProjectLinkButtons class="mt-6" :links="project.platforms.slice(0, 2)" :project="project.slug" />
      </div>
      <div id="player" class="lg:col-span-2">
        <UiEmbedFacade
          :key="playerKey"
          :start-active="playerKey > 0"
          :src="player.src"
          :title="player.title"
          :poster="player.poster"
          :poster-alt="`${project.name} cover art`"
          variant="spotify"
          :event="EVENTS.MUSIC_PLAY"
          :event-params="{ project: project.slug, item: player.item }"
        />
      </div>
    </header>

    <!-- What it is -->
    <section class="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <span class="eyebrow">What it is</span>
        <div class="mt-4 space-y-4 text-fg-muted leading-relaxed">
          <p v-for="para in project.concept" :key="para">
            {{ para }}
          </p>
        </div>
      </div>
      <aside v-if="project.characters?.length" class="border border-line bg-panel p-5">
        <span class="eyebrow">The characters</span>
        <dl class="mt-3 space-y-3">
          <div v-for="c in project.characters" :key="c.name">
            <dt class="font-semibold text-fg">
              {{ c.name }}
            </dt>
            <dd class="text-sm text-fg-muted">
              {{ c.role }}
            </dd>
          </div>
        </dl>
        <p class="mt-4 pt-3 border-t border-line text-xs text-fg-muted">
          Author: Ravy. Idea, story and sound.
        </p>
      </aside>
    </section>

    <!-- Discography -->
    <section class="mt-14">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <span class="eyebrow">Discography</span>
        <span class="font-spacemono text-xs text-fg-muted">
          {{ project.releases.length }} {{ project.releases.length === 1 ? 'album' : 'albums' }}<template v-if="total"> · {{ total }} tracks</template>
        </span>
      </div>
      <ol class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <li
          v-for="release in shownReleases"
          :key="release.title"
          class="flex gap-4 border bg-panel p-4 transition-colors"
          :class="current?.title === release.title ? 'border-accent-400 dark:border-accent-600' : 'border-line'"
        >
          <div class="shrink-0 w-24 h-24 overflow-hidden bg-panel-raised">
            <NuxtImg
              v-if="!failedCovers.has(release.title)"
              :src="release.cover"
              :alt="`${release.title} cover`"
              width="96"
              height="96"
              sizes="96px"
              densities="x1 x2"
              format="webp"
              class="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              @error="failedCovers.add(release.title)"
            />
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-fg leading-snug">
              {{ release.title }}
            </p>
            <p class="font-spacemono text-micro text-fg-muted">
              {{ releaseMonth(release.date) }}<template v-if="release.trackCount">
                · {{ release.trackCount }} tracks
              </template>
            </p>
            <p v-if="release.theme" class="mt-1 text-sm text-fg-muted leading-snug">
              {{ release.theme }}
            </p>
            <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
              <button
                v-if="release.spotifyAlbumId"
                type="button"
                class="inline-flex items-center gap-1 text-accent-ink hover:underline cursor-pointer"
                @click="choose(release)"
              >
                <Icon name="mdi:play" class="w-3.5 h-3.5" aria-hidden="true" /> Play here
              </button>
              <a
                v-for="link in release.links"
                :key="link.url"
                :href="link.url"
                target="_blank"
                rel="noopener"
                class="text-fg-muted hover:text-accent-500"
              >{{ platformLabel(link) }}</a>
            </div>
          </div>
        </li>
      </ol>
      <button
        v-if="!showAll"
        type="button"
        class="mt-4 inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500 cursor-pointer"
        @click="showAll = true"
      >
        <Icon name="mdi:chevron-down" class="w-4 h-4" aria-hidden="true" /> Show all {{ project.releases.length }} albums
      </button>
    </section>

    <!-- Platforms -->
    <section class="mt-14 border-t border-line pt-8">
      <span class="eyebrow">Listen everywhere</span>
      <ProjectLinkButtons class="mt-4" compact :links="project.platforms" :project="project.slug" />
      <p class="mt-6 text-sm text-fg-muted">
        Official site: <a :href="project.website" target="_blank" rel="noopener" class="underline hover:text-accent-500">{{ project.website.replace(/^https?:\/\//, '') }}</a>
      </p>
    </section>

    <ProjectRelatedPosts :tag="project.blogTag" title="Writing about it" />

    <div class="mt-14">
      <NuxtLink to="/music" class="inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500">
        <Icon name="mdi:arrow-left" class="w-4 h-4" aria-hidden="true" /> All music
      </NuxtLink>
    </div>
  </div>
</template>
