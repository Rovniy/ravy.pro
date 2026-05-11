<script setup lang="ts">
import { footerData, navbarData, socialNetworks } from '~/data'
</script>

<template>
  <div>
    <p class="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
      {{ navbarData.homeTitle }}
    </p>

    <p class="mt-1 text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
      {{ footerData.author }}
    </p>

    <p class="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ footerData.aboutAuthor }}
    </p>

    <div class="mt-5 flex flex-wrap gap-2.5">
      <NuxtLink
        v-for="item in socialNetworks"
        :key="item.name"
        :to="item.href"
        target="_blank"
        :aria-label="item.name"
        class="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
      >
        <Icon :name="item.icon" size="16" />
      </NuxtLink>
    </div>
  </div>
</template>
