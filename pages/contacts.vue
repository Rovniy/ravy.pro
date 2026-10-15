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
})
</script>

<template>
  <div class="text-fg-muted">
    <div class="container max-w-md mx-auto px-6 py-14">
      <div class="flex flex-col items-center text-center">
        <NuxtImg
          src="/photos/a_rovnyi_small.webp"
          :alt="baseData.me.name"
          width="96"
          height="96"
          class="w-24 h-24 object-cover ring-2 ring-accent-500/40"
        />
        <h1 class="mt-4 text-3xl font-display font-extrabold uppercase text-fg leading-none">
          {{ baseData.me.name }}
        </h1>
        <p class="mt-1 text-sm text-fg-muted">
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
            class="group flex items-center gap-4 border border-line bg-panel border-l-4 border-l-(--brand) p-4 hover:border-(--brand) transition-colors"
            @click="track('contact_click', { method: item.method })"
          >
            <span
              :style="{ background: item.brandGradient || item.brand }"
              class="flex items-center justify-center w-10 h-10 shrink-0 text-white ring-1 ring-line transition-transform"
            >
              <Icon :name="item.icon" size="20" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-fg">{{ item.name }}</span>
              <span class="block truncate text-sm text-fg-muted group-hover:text-(--brand) transition-colors">{{ item.handle }}</span>
            </span>
            <Icon
              name="mdi:open-in-new"
              size="16"
              class="shrink-0 text-fg-subtle group-hover:text-(--brand) transition-colors"
              aria-hidden="true"
            />
          </a>

          <button
            v-else
            type="button"
            :style="{ '--brand': item.brand }"
            class="group flex w-full items-center gap-4 border border-line bg-panel border-l-4 border-l-(--brand) p-4 text-left hover:border-(--brand) transition-colors"
            @click="copyHandle(item)"
          >
            <span
              :style="{ background: item.brandGradient || item.brand }"
              class="flex items-center justify-center w-10 h-10 shrink-0 text-white ring-1 ring-line transition-transform"
            >
              <Icon :name="item.icon" size="20" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-semibold text-fg">{{ item.name }}</span>
              <span class="block truncate text-sm text-fg-muted group-hover:text-(--brand) transition-colors">{{ item.handle }}</span>
            </span>
            <span
              v-if="copiedName === item.name"
              class="shrink-0 text-xs font-semibold text-(--brand)"
            >Copied</span>
            <Icon
              v-else
              name="mdi:content-copy"
              size="16"
              class="shrink-0 text-fg-subtle group-hover:text-(--brand) transition-colors"
              aria-hidden="true"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
