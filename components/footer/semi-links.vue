<script setup lang="ts">
const links = [
  { to: '/docs/privacy-policy', text: 'Privacy Policy' },
  { to: '/docs/terms-of-use', text: 'Terms of Use' },
  { to: '/links', text: 'Links' },
  { to: '/contacts', text: 'Contacts' },
]
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
    <template v-for="(item, index) in links" :key="item.to">
      <NuxtLink
        :to="item.to"
        class="text-fg-muted hover:text-accent-ink transition-colors"
      >
        {{ item.text }}
      </NuxtLink>
      <span
        v-if="index < links.length - 1"
        class="text-line-strong"
        aria-hidden="true"
      >·</span>
    </template>
  </div>
</template>
