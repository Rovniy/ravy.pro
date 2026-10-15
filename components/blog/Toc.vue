<script setup lang="ts">
import type { ParsedContentv2 } from '@nuxt/content'

const props = withDefaults(defineProps<{ articles: ParsedContentv2 | null }>(), {
  articles: null,
})

const links = computed(() => (props.articles?.body as any)?.toc?.links ?? [])

const allLinks = computed(() =>
  links.value.flatMap((l: any) => [l, ...(l.children ?? [])]),
)

// Active heading comes from an IntersectionObserver, not from the scroll
// position. The previous version deliberately re-ran on every scroll tick and
// then called getElementById + getBoundingClientRect() for *every* heading —
// on a 17-heading post that is 17 forced synchronous layouts per frame. The
// observer does the same job with zero per-frame work.
//
// Starts as '' so the server render and the client's first render agree (no
// heading highlighted); the observer fills it in right after mount.
const activeId = ref('')
let observer: IntersectionObserver | null = null

function observeHeadings() {
  observer?.disconnect()
  observer = null
  if (!import.meta.client || !allLinks.value.length)
    return

  const visible = new Set<string>()
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting)
        visible.add(entry.target.id)
      else
        visible.delete(entry.target.id)
    }
    // Topmost visible heading wins. When the band is empty (mid-section, between
    // two headings) the previous value is kept so the marker doesn't flicker off.
    const first = allLinks.value.find((l: any) => visible.has(l.id))
    if (first)
      activeId.value = first.id
  }, { rootMargin: '-96px 0px -65% 0px' })

  for (const link of allLinks.value) {
    const el = document.getElementById(link.id)
    if (el)
      observer.observe(el)
  }
}

onMounted(observeHeadings)
watch(allLinks, () => nextTick(observeHeadings))
onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <!-- A sticky rail in the post's own grid row (pages/blogs/[blog].vue), so it
       stops at the end of the article instead of sliding over Related posts. -->
  <aside v-if="links.length" class="hidden lg:block lg:col-span-3 self-start sticky top-[calc(var(--header-h)+2rem)]">
    <div class="flex items-center gap-2.5 mb-4">
      <span class="w-1 h-4 bg-accent" aria-hidden="true" />
      <p class="font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle">
        On this page
      </p>
    </div>

    <!--
      Not wrapped in <client-only>. The link list is derived from `body.toc`,
      which is available during SSR, so crawlers see the section links. Only the
      active-heading highlight needs the client, and that is a class binding.
    -->
    <nav class="max-h-[calc(100vh-var(--header-h)-8rem)] overflow-y-auto overscroll-contain border-l border-line [scrollbar-width:thin] [scrollbar-color:var(--ui-line-strong)_transparent]" aria-label="On this page">
      <template v-for="link in links" :key="link.id">
        <NuxtLink
          :to="`#${link.id}`"
          class="-ml-px block py-1.5 pl-4 pr-2 border-l-2 text-sm leading-snug transition-colors duration-150"
          :class="activeId === link.id
            ? 'border-accent text-fg font-semibold bg-panel'
            : 'border-transparent text-fg-muted hover:text-fg hover:border-line-strong'"
        >
          {{ link.text }}
        </NuxtLink>

        <template v-if="link.children?.length">
          <NuxtLink
            v-for="child in link.children"
            :key="child.id"
            :to="`#${child.id}`"
            class="-ml-px block py-1 pl-7 pr-2 border-l-2 text-xs leading-snug transition-colors duration-150"
            :class="activeId === child.id
              ? 'border-accent text-fg font-semibold bg-panel'
              : 'border-transparent text-fg-subtle hover:text-fg hover:border-line-strong'"
          >
            {{ child.text }}
          </NuxtLink>
        </template>
      </template>
    </nav>

    <a href="#" class="mt-4 inline-flex items-center gap-1.5 font-spacemono text-micro uppercase tracking-[0.12em] text-fg-subtle hover:text-accent-ink transition-colors">
      <Icon name="mdi:arrow-up" size="14" aria-hidden="true" />
      Back to top
    </a>
  </aside>
</template>
