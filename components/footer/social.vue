<script setup lang="ts">
import { footerData, navbarData, socialNetworks } from '~/data'
</script>

<template>
  <div>
    <p class="text-xl font-bold tracking-tight text-fg">
      {{ navbarData.homeTitle }}
    </p>

    <p class="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
      {{ footerData.aboutAuthor }}
    </p>

    <div class="mt-5 flex flex-wrap gap-2.5">
      <NuxtLink
        v-for="item in socialNetworks"
        :key="item.name"
        :to="item.href"
        target="_blank"
        :aria-label="item.name"
        class="w-11 h-11 flex items-center justify-center text-fg-muted hover:bg-accent/10 hover:text-accent-ink transition-colors"
      >
        <Icon :name="item.icon" size="18" aria-hidden="true" />
      </NuxtLink>
    </div>
  </div>
</template>
