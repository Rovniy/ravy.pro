<script setup lang="ts">
import { footerData } from '~/data'

const colorMode = useColorMode()

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
    <span>{{ footerData.copyright }}</span>

    <a href="/rss.xml" aria-label="Subscribe to RSS Feed" class="hover:text-sky-500 transition-colors">
      <Icon name="bi:rss-fill" size="13" />
    </a>

    <ClientOnly>
      <button
        type="button"
        :aria-label="colorMode.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
        :title="colorMode.value === 'dark' ? 'Light theme' : 'Dark theme'"
        class="hover:text-sky-500 transition-colors hover:cursor-pointer"
        @click="toggleTheme"
      >
        <Icon
          :name="colorMode.value === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'"
          size="14"
        />
      </button>
      <template #fallback>
        <Icon name="mdi:theme-light-dark" size="14" />
      </template>
    </ClientOnly>
  </div>
</template>
