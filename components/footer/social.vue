<script setup lang="ts">
import { footerData, navbarData, socialNetworks } from '~/data'
</script>

<template>
  <div>
    <p class="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
      {{ navbarData.homeTitle }}
    </p>

    <p class="mt-4 max-w-xs text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      {{ footerData.aboutAuthor }}
    </p>

    <div class="mt-5 flex flex-wrap gap-2.5">
      <NuxtLink
        v-for="item in socialNetworks"
        :key="item.name"
        :to="item.href"
        target="_blank"
        :aria-label="item.name"
        class="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        <Icon :name="item.icon" size="16" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>
