<script setup lang="ts">
import type { ContactLink } from '~/data'
import { baseData, contactLinks, contactsPage, seoData } from '~/data'

const { track } = useAnalytics()

// Hide entries that still carry TODO placeholders so no dead links ship.
const visibleContacts = contactLinks
  .filter(item => !item.handle.includes('TODO') && !(item.href && item.href.includes('TODO')))
  .sort((a, b) => a.name.localeCompare(b.name))

const copiedName = ref('')
let copyTimer: ReturnType<typeof setTimeout> | undefined

async function copyHandle(item: ContactLink) {
  try {
    await navigator.clipboard.writeText(item.handle)
  }
  catch {
    return
  }
  copiedName.value = item.name
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedName.value = ''
  }, 1500)
  track('contact_click', { method: item.method })
}

function isExternal(href: string) {
  return /^https?:/i.test(href)
}

useHead({
  title: contactsPage.meta.title,
  titleTemplate: '%s',
  meta: [
    { name: 'description', content: contactsPage.meta.description },
  ],
})

useGenericPageSchema({
  url: `${seoData.mySite}/contacts`,
  name: 'Contacts',
  description: contactsPage.meta.description,
  type: 'AboutPage',
  image: `${seoData.mySite}/andrei_rovnyi.webp`,
})

// Generate OG Image
defineOgImage('Blog', {
  headline: contactsPage.og.headline,
  title: contactsPage.og.title,
  description: contactsPage.og.description,
  link: contactsPage.og.link,
  url: contactsPage.og.link,
})
</script>

<template>
  <main class="text-slate-600 dark:text-slate-300">
    <div class="container max-w-md mx-auto px-6 py-14">
      <div class="flex flex-col items-center text-center">
        <NuxtImg
          src="/andrei_rovnyi.webp"
          :alt="baseData.me.name"
          width="96"
          height="96"
          class="w-24 h-24 rounded-full object-cover ring-2 ring-accent-500/40 shadow-md"
        />
        <h1 class="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ baseData.me.name }}
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ contactsPage.content.description }}
        </p>
      </div>

      <ul class="mt-10 space-y-3">
        <li v-for="item in visibleContacts" :key="item.name">
          <a
            v-if="item.href"
            :href="item.href"
            :target="isExternal(item.href) ? '_blank' : undefined"
            :rel="isExternal(item.href) ? 'noopener' : undefined"
            :style="{ '--brand': item.brand }"
            class="group flex items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 bg-linear-to-r from-(--brand)/10 to-transparent to-65% p-4 shadow-sm hover:border-(--brand)/60 hover:shadow-md hover:shadow-(color:--brand)/20 transition-all"
            @click="track('contact_click', { method: item.method })"
          >
            <span
              :style="{ background: item.brandGradient || item.brand }"
              class="flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-white ring-1 ring-black/10 dark:ring-white/15 shadow-sm group-hover:scale-105 transition-transform"
            >
              <Icon :name="item.icon" size="20" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100">{{ item.name }}</span>
              <span class="block truncate text-sm text-slate-500 dark:text-slate-400 group-hover:text-(--brand) transition-colors">{{ item.handle }}</span>
            </span>
            <Icon
              name="mdi:open-in-new"
              size="16"
              class="shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-(--brand) transition-colors"
              aria-hidden="true"
            />
          </a>

          <button
            v-else
            type="button"
            :style="{ '--brand': item.brand }"
            class="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 bg-linear-to-r from-(--brand)/10 to-transparent to-65% p-4 text-left shadow-sm hover:border-(--brand)/60 hover:shadow-md hover:shadow-(color:--brand)/20 transition-all"
            @click="copyHandle(item)"
          >
            <span
              :style="{ background: item.brandGradient || item.brand }"
              class="flex items-center justify-center w-10 h-10 shrink-0 rounded-full text-white ring-1 ring-black/10 dark:ring-white/15 shadow-sm group-hover:scale-105 transition-transform"
            >
              <Icon :name="item.icon" size="20" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100">{{ item.name }}</span>
              <span class="block truncate text-sm text-slate-500 dark:text-slate-400 group-hover:text-(--brand) transition-colors">{{ item.handle }}</span>
            </span>
            <span
              v-if="copiedName === item.name"
              class="shrink-0 text-xs font-semibold text-(--brand)"
            >Copied</span>
            <Icon
              v-else
              name="mdi:content-copy"
              size="16"
              class="shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-(--brand) transition-colors"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>
  </main>
</template>
