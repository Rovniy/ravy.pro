<script setup lang="ts">
import type { ExternalLink } from '~/data/projects'
import { EVENTS } from '~/data/analytics'
import { PLATFORM_META, platformLabel } from '~/data/projects'

// Store / streaming buttons. The first link is the primary one.
// `outbound_click` already fires for every one of these from the delegated
// listener in plugins/analytics.client.ts; `store_click` is the project-level
// conversion, carrying which project and which store.

const props = withDefaults(defineProps<{
  links: ExternalLink[]
  project: string
  /** `compact` renders icon chips (a row of streaming platforms). */
  compact?: boolean
}>(), { compact: false })

const { track } = useAnalytics()

function onClick(link: ExternalLink) {
  track(EVENTS.STORE_CLICK, { project: props.project, store: link.kind })
}
</script>

<template>
  <div v-if="links.length" class="flex flex-wrap items-center gap-3">
    <template v-if="!compact">
      <a
        v-for="(link, i) in links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 px-5 py-3 font-medium transition"
        :class="i === 0
          ? 'bg-fg text-bg hover:opacity-90'
          : 'border border-line-strong text-fg hover:border-accent-500'"
        @click="onClick(link)"
      >
        <Icon :name="PLATFORM_META[link.kind].icon" class="w-5 h-5" aria-hidden="true" />
        {{ platformLabel(link) }}
        <Icon name="mdi:open-in-new" class="w-4 h-4 opacity-60" aria-hidden="true" />
      </a>
    </template>
    <template v-else>
      <a
        v-for="link in links"
        :key="link.url"
        :href="link.url"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 border border-line bg-panel px-3.5 py-2 text-sm font-medium text-fg hover:border-accent-500 hover:text-accent-ink transition"
        @click="onClick(link)"
      >
        <Icon :name="PLATFORM_META[link.kind].icon" class="w-4 h-4" aria-hidden="true" />
        {{ platformLabel(link) }}
      </a>
    </template>
  </div>
</template>
