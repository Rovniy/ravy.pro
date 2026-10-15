<script setup lang="ts">
import { baseData } from '~/data'
import { EVENTS } from '~/data/analytics'
import { gameBySlug, gamePath } from '~/data/games'
import { factSheetText, pressFacts, pressFiles, pressZipName } from '~/utils/press-kit'

// The press kit: everything a journalist or a streamer needs on one page,
// built from the same registry entry as the game page. Images are zipped in the
// browser (fflate, lazy-loaded) from the files this site already serves, so
// there is no build step and no archive to keep in sync.

const route = useRoute()
const game = gameBySlug(String(route.params.slug))
if (!game)
  throw createError({ statusCode: 404, statusMessage: 'Game not found', fatal: true })

useGamePressPageSchema(game)

const { track } = useAnalytics()
const facts = pressFacts(game)
const files = pressFiles(game)
const email = baseData.me.email
const mailto = `mailto:${email}?subject=${encodeURIComponent(`Press: ${game.title}`)}`
// Nothing to stream until there is a build to play.
const playable = game.status !== 'in-development'

const copied = ref<'short' | 'long' | null>(null)
async function copy(item: 'short' | 'long') {
  const text = item === 'short' ? game!.press.short : game!.press.long.join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
    copied.value = item
    setTimeout(() => {
      if (copied.value === item)
        copied.value = null
    }, 2000)
    track(EVENTS.PRESS_COPY, { project: game!.slug, item })
  }
  catch {}
}

const zipping = ref(false)
const zipError = ref(false)
async function downloadZip() {
  if (zipping.value)
    return
  zipping.value = true
  zipError.value = false
  try {
    const folder = pressZipName(game!).replace(/\.zip$/, '')
    const entries: Record<string, Uint8Array> = {
      [`${folder}/fact-sheet.txt`]: new TextEncoder().encode(factSheetText(game!, { site: baseData.site.url, email })),
    }
    const bodies = await Promise.all(files.map(async (f) => {
      const res = await fetch(f.path)
      if (!res.ok)
        throw new Error(`${f.path}: ${res.status}`)
      return new Uint8Array(await res.arrayBuffer())
    }))
    files.forEach((f, i) => {
      entries[`${folder}/${f.name}`] = bodies[i]!
    })
    const { zipSync } = await import('fflate')
    // Images are already compressed; storing them is faster and no bigger.
    const blob = new Blob([zipSync(entries, { level: 0 })], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = pressZipName(game!)
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    track(EVENTS.PRESS_KIT_DOWNLOAD, { project: game!.slug, files: files.length })
  }
  catch {
    zipError.value = true
  }
  finally {
    zipping.value = false
  }
}
</script>

<template>
  <div v-if="game" class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Header -->
    <header>
      <NuxtLink :to="gamePath(game)" class="eyebrow hover:text-accent-500 transition-colors">
        Games · {{ game.title }}
      </NuxtLink>
      <h1 class="mt-2 text-4xl sm:text-5xl font-display font-extrabold uppercase text-fg leading-none">
        {{ game.title }} press kit
      </h1>
      <p class="mt-3 max-w-3xl text-lg text-fg leading-relaxed">
        Facts, copy and images for writing about {{ game.title }}. Quote the text as is and use the images in your coverage.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <UiButton :disabled="zipping" @click="downloadZip">
          <Icon name="mdi:folder-zip-outline" class="w-5 h-5" aria-hidden="true" />
          {{ zipping ? 'Preparing…' : `Download all (ZIP, ${files.length + 1} files)` }}
        </UiButton>
        <a
          :href="mailto"
          class="inline-flex items-center gap-2 border border-line-strong bg-panel px-4 py-2 text-sm font-medium text-fg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Icon name="mdi:email-outline" class="w-5 h-5" aria-hidden="true" /> Press contact
        </a>
      </div>
      <p v-if="zipError" class="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">
        The archive could not be built. The images below can be downloaded one by one.
      </p>
    </header>

    <!-- Fact sheet -->
    <section class="mt-12">
      <span class="eyebrow">Fact sheet</span>
      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 border border-line bg-panel p-5 sm:p-6">
        <div v-for="fact in facts" :key="fact.label">
          <dt class="text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {{ fact.label }}
          </dt>
          <dd class="mt-1 text-fg">
            {{ fact.value }}
          </dd>
        </div>
      </dl>
      <ProjectLinkButtons class="mt-6" :links="game.links" :project="game.slug" />
    </section>

    <!-- Descriptions -->
    <section class="mt-14 grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div class="lg:col-span-2 border border-line bg-panel p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <span class="eyebrow">Short description</span>
          <button type="button" class="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent-500" @click="copy('short')">
            <Icon v-if="copied === 'short'" name="mdi:check" class="w-4 h-4 text-ok" aria-hidden="true" />
            <Icon v-else name="mdi:content-copy" class="w-4 h-4" aria-hidden="true" />
            {{ copied === 'short' ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <p class="mt-3 text-fg leading-relaxed">
          {{ game.press.short }}
        </p>
      </div>
      <div class="lg:col-span-3 border border-line bg-panel p-5 sm:p-6">
        <div class="flex items-center justify-between gap-4">
          <span class="eyebrow">Long description</span>
          <button type="button" class="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-accent-500" @click="copy('long')">
            <Icon v-if="copied === 'long'" name="mdi:check" class="w-4 h-4 text-ok" aria-hidden="true" />
            <Icon v-else name="mdi:content-copy" class="w-4 h-4" aria-hidden="true" />
            {{ copied === 'long' ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <p v-for="para in game.press.long" :key="para" class="mt-3 text-fg leading-relaxed">
          {{ para }}
        </p>
      </div>
    </section>

    <!-- Trailer -->
    <section v-if="game.trailerYoutubeId" class="mt-14">
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
      <p class="mt-3 text-sm text-fg-muted">
        Embed or link it from YouTube:
        <a :href="`https://www.youtube.com/watch?v=${game.trailerYoutubeId}`" class="underline hover:text-accent-500" target="_blank" rel="noopener">youtube.com/watch?v={{ game.trailerYoutubeId }}</a>
      </p>
    </section>

    <!-- Images -->
    <section v-if="files.length" class="mt-14">
      <span class="eyebrow">Logo, cover and screenshots</span>
      <ul class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <li v-for="file in files" :key="file.path" class="group">
          <a
            :href="file.path"
            :download="file.name"
            class="block overflow-hidden border border-line bg-panel-raised"
          >
            <NuxtImg
              :src="file.path"
              :alt="file.alt"
              width="480"
              densities="x1 x2"
              format="webp"
              loading="lazy"
              class="w-full aspect-video object-contain transition-transform"
            />
          </a>
          <a :href="file.path" :download="file.name" class="mt-2 inline-flex items-center gap-1 font-spacemono text-micro text-fg-muted hover:text-accent-500">
            <Icon name="mdi:download" class="w-3.5 h-3.5" aria-hidden="true" /> {{ file.name }}
          </a>
        </li>
      </ul>
    </section>

    <!-- Contact -->
    <section class="mt-14 border-t border-line pt-8">
      <span class="eyebrow">Contact</span>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 text-fg leading-relaxed">
        <p>
          Press, creators and partners: <a :href="mailto" class="underline hover:text-accent-500">{{ email }}</a>.
          Interviews, questions about the game and the studio, and requests for anything that is not on this page.
        </p>
        <p v-if="playable">
          Streaming and videos are welcome. You may stream {{ game.title }} and publish and monetise videos of it; a link back to the game is appreciated.
        </p>
        <p v-else>
          {{ game.title }} is in development and not playable yet. Follow the build in the
          <NuxtLink :to="game.blogPath ?? gamePath(game)" class="underline hover:text-accent-500">
            devlog
          </NuxtLink>.
        </p>
      </div>
    </section>

    <div class="mt-14">
      <NuxtLink :to="gamePath(game)" class="inline-flex items-center gap-1.5 font-spacemono text-xs uppercase tracking-wider text-fg-muted hover:text-accent-500">
        <Icon name="mdi:arrow-left" class="w-4 h-4" aria-hidden="true" /> {{ game.title }}
      </NuxtLink>
    </div>
  </div>
</template>
