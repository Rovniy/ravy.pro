<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div class="mt-4 flex items-center justify-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
    <span>{{ footerData.copyright }}</span>

    <a href="/rss.xml" aria-label="Subscribe to RSS Feed" class="hover:text-sky-500 transition-colors">
      <Icon name="bi:rss-fill" size="13" />
    </a>
  </div>
</template>
