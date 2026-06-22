<script lang="ts" setup>
const links: { to: string, text: string }[] = [
  { to: '/', text: 'Home' },
  { to: '/blogs', text: 'Blogs' },
  { to: '/categories', text: 'Categories' },
  { to: '/about', text: 'About Me' },
  { to: '/tools/qr-code-generator', text: 'QR Code Generator' },
]
</script>

<template>
  <div>
    <p class="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
      <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
      Quick Links
    </p>

    <nav class="flex flex-col gap-2.5">
      <NuxtLink
        v-for="item in links"
        :key="item.to"
        :to="item.to"
        class="group inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
      >
        <span>{{ item.text }}</span>
        <Icon
          name="mdi:arrow-right"
          size="14"
          class="ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
        />
      </NuxtLink>
    </nav>
  </div>
</template>
