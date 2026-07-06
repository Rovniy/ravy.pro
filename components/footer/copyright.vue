<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-1 gap-y-2 font-spacemono text-xs text-slate-500 dark:text-slate-400">
    <span class="mr-2">{{ footerData.copyright }}</span>

    <a
      href="/rss.xml"
      aria-label="Subscribe to RSS Feed"
      class="inline-flex p-2.5 -my-2.5 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
    >
      <Icon name="bi:rss-fill" size="14" aria-hidden="true" />
    </a>

    <UiThemeToggle icon-size="15" class="p-2.5 -my-2.5" />
  </div>
</template>
