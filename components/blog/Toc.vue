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
  <div v-if="links.length" class="lg:col-span-3 sticky top-28 max-h-[70vh] hidden lg:flex flex-col justify-self-end pointer-events-none">
    <div class="border dark:border-slate-800 rounded-xl p-4 min-w-[200px] dark:bg-slate-900 overflow-y-auto pointer-events-auto">
      <p class="font-spacemono text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 pb-2 border-b dark:border-slate-800">
        On this page
      </p>

      <!--
        Not wrapped in <client-only> any more. The link list is derived from
        `body.toc`, which is available during SSR — hiding it behind ClientOnly
        meant the prerendered HTML contained an empty <span> where the table of
        contents should be, so crawlers saw no section links at all. Only the
        active-heading highlight needs the client, and that is a class binding.
      -->
      <nav class="space-y-0.5" aria-label="On this page">
        <template v-for="link in links" :key="link.id">
          <NuxtLink
            :to="`#${link.id}`"
            class="flex items-center text-xs py-1 pl-2 border-l-2 transition-all duration-200"
            :class="activeId === link.id
              ? 'border-accent-500 text-accent-500 dark:text-accent-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'"
          >
            {{ link.text }}
          </NuxtLink>

          <template v-if="link.children?.length">
            <NuxtLink
              v-for="child in link.children"
              :key="child.id"
              :to="`#${child.id}`"
              class="flex items-center text-xs py-1 pl-5 border-l-2 transition-all duration-200"
              :class="activeId === child.id
                ? 'border-accent-500 text-accent-500 dark:text-accent-400 font-semibold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'"
            >
              {{ child.text }}
            </NuxtLink>
          </template>
        </template>
      </nav>
    </div>
  </div>
</template>
