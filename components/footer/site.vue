<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
      About This Site
    </p>

    <p class="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
      {{ footerData.aboutTheSite }}
    </p>
  </div>
</template>
