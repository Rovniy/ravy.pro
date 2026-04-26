<script setup lang="ts">
const links = [
  { to: '/docs/privacy-policy', text: 'Privacy Policy' },
  { to: '/docs/terms-of-use', text: 'Terms of Use' },
  { to: '/links', text: 'Links' },
]
</script>

<template>
  <div class="border-t border-zinc-200 dark:border-zinc-800 mt-10 pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
    <NuxtLink
      v-for="item in links"
      :key="item.to"
      :to="item.to"
      class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
    >
      {{ item.text }}
    </NuxtLink>
  </div>
</template>
