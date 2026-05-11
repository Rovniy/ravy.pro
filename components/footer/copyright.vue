<script setup lang="ts">
import { footerData } from '~/data'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-zinc-500 dark:text-zinc-400">
    <span>{{ footerData.copyright }}</span>

    <a
      href="/rss.xml"
      aria-label="Subscribe to RSS Feed"
      class="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
    >
      <Icon name="bi:rss-fill" size="14" />
    </a>

    <ClientOnly>
      <button
        type="button"
        :aria-label="colorMode.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        :title="colorMode.value === 'dark' ? 'Light theme' : 'Dark theme'"
        class="hover:text-sky-500 dark:hover:text-sky-400 transition-colors hover:cursor-pointer"
        @click="toggleTheme"
      >
        <Icon
          :name="colorMode.value === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'"
          size="15"
        />
      </button>
      <template #fallback>
        <Icon name="mdi:theme-light-dark" size="15" />
      </template>
    </ClientOnly>
  </div>
</template>
