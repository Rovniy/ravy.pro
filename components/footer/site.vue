<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div>
    <p class="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
      About This Site
    </p>

    <p class="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
      {{ footerData.aboutTheSite }}
    </p>
  </div>
</template>
