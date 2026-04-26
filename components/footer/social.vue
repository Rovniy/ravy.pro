<script setup lang="ts">
import { footerData, socialNetworks } from '~/data'
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
      About
    </p>

    <p class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
      {{ footerData.author }}
    </p>

    <p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ footerData.aboutAuthor }}
    </p>

    <div class="mt-4 flex gap-2">
      <NuxtLink
        v-for="item in socialNetworks"
        :key="item.name"
        :to="item.href"
        target="_blank"
        :aria-label="item.name"
        class="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-sky-400 hover:text-sky-500 dark:hover:text-sky-400 transition-all"
      >
        <Icon :name="item.icon" size="14" />
      </NuxtLink>
    </div>
  </div>
</template>
