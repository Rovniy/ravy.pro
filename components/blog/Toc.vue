<script setup lang="ts">
import type { ParsedContent } from '@nuxt/content'

const props = withDefaults(defineProps<{ articles: ParsedContent | null }>(), {
  articles: null,
})

const links = computed(() => (props.articles?.body as any)?.toc?.links ?? [])

const allLinks = computed(() =>
  links.value.flatMap((l: any) => [l, ...(l.children ?? [])]),
)

const { y } = useWindowScroll()

const activeId = computed(() => {
  if (!import.meta.client || !allLinks.value.length) return ''
  y.value // reactive dependency — re-evaluates on every scroll tick

  const all = allLinks.value
  for (let i = all.length - 1; i >= 0; i--) {
    const el = document.getElementById(all[i].id)
    if (el && el.getBoundingClientRect().top <= 100)
      return all[i].id
  }
  return all[0]?.id ?? ''
})
</script>

<template>
  <div v-if="links.length" class="lg:col-span-3 sticky top-28 max-h-[70vh] hidden lg:flex flex-col justify-self-end">
    <div class="border dark:border-gray-800 rounded-xl p-4 min-w-[200px] dark:bg-slate-900 overflow-y-auto">
      <p class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 pb-2 border-b dark:border-gray-800">
        On this page
      </p>

      <nav class="space-y-0.5">
        <template v-for="link in links" :key="link.id">
          <NuxtLink
            :to="`#${link.id}`"
            class="flex items-center text-xs py-1 pl-2 border-l-2 transition-all duration-200"
            :class="activeId === link.id
              ? 'border-sky-500 text-sky-500 dark:text-sky-400 font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'"
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
                ? 'border-sky-500 text-sky-500 dark:text-sky-400 font-semibold'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'"
            >
              {{ child.text }}
            </NuxtLink>
          </template>
        </template>
      </nav>
    </div>
  </div>
</template>
