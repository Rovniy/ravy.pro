<script lang="ts" setup>
const links: { to: string; text: string }[] = [
  {
    to: '/',
    text: 'Home',
  },
  {
    to: '/blogs',
    text: 'Blogs',
  },
  {
    to: '/categories',
    text: 'Categories',
  },
  {
    to: '/about',
    text: 'About Me',
  },
]
</script>

<template>
  <div class="flex flex-col dark:text-zinc-300 my-5 md:my-0 md:justify-self-center">
    <p class="text-black dark:text-zinc-300  text-base font-semibold">
      Quick Link
    </p>
    <NuxtLink v-for="item in links" :key="item.to" :to="item.to" class="hover:underline">
      {{ item.text }}
    </NuxtLink>
  </div>
</template>
