<script setup lang="ts">
import { footerData, seoData } from '~/data'
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
      {{ footerData.authorTitle }}
    </p>

    <p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ footerData.authorInterest }}
    </p>

    <a
      :href="`mailto:${seoData.mailAddress}`"
      class="inline-flex items-center justify-center gap-2 w-full mt-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors"
    >
      <Icon name="mdi:mail-outline" size="15" />
      Contact Me
    </a>
  </div>
</template>
