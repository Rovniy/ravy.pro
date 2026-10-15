<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div>
    <p class="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
      <span class="inline-block w-1.5 h-3 bg-accent -skew-x-10" />
      About This Site
    </p>

    <p class="text-sm leading-relaxed text-fg-muted">
      {{ footerData.aboutTheSite }}
    </p>
  </div>
</template>
