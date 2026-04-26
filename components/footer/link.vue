<script lang="ts" setup>
const links: { to: string; text: string }[] = [
  { to: '/', text: 'Home' },
  { to: '/blogs', text: 'Blogs' },
  { to: '/categories', text: 'Categories' },
  { to: '/about', text: 'About Me' },
]
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
      Quick Links
    </p>

    <nav class="flex flex-col gap-2">
      <NuxtLink
        v-for="item in links"
        :key="item.to"
        :to="item.to"
        class="text-sm text-zinc-600 dark:text-zinc-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
      >
        {{ item.text }}
      </NuxtLink>
    </nav>
  </div>
</template>
