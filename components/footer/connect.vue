<script setup lang="ts">
import { footerData, seoData } from '~/data'
</script>

<template>
  <div>
    <p class="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
      {{ footerData.authorTitle }}
    </p>

    <p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ footerData.authorInterest }}
    </p>

    <a
      :href="`mailto:${seoData.mailAddress}`"
      class="inline-flex items-center justify-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold ring-1 ring-sky-400/30 shadow-sm hover:shadow-md transition-all"
    >
      <Icon name="mdi:mail-outline" size="16" />
      Contact Me
    </a>
  </div>
</template>
