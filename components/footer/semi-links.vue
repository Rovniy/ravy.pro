<script setup lang="ts">
const links = [
  { to: '/docs/privacy-policy', text: 'Privacy Policy' },
  { to: '/docs/terms-of-use', text: 'Terms of Use' },
  { to: '/links', text: 'Links' },
]
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
    <template v-for="(item, index) in links" :key="item.to">
      <NuxtLink
        :to="item.to"
        class="text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        {{ item.text }}
      </NuxtLink>
      <span
        v-if="index < links.length - 1"
        class="text-slate-300 dark:text-slate-700"
        aria-hidden="true"
      >·</span>
    </template>
  </div>
</template>
