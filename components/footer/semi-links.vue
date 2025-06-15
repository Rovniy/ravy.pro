<script setup lang="ts">
const links = [
  {
    to: '/docs/privacy-policy',
    text: 'Privacy Policy',
  },
  {
    to: '/docs/terms-of-use',
    text: 'Terms of Use',
  },
  {
    to: '/links',
    text: 'Links',
  },
]
</script>

<template>
  <div class="border-t dark:border-gray-800 mt-5 p-4 flex content-center justify-center gap-6">
    <NuxtLink v-for="item in links" :key="item.to" :to="item.to" class="hover:underline text-gray-400 hover:text-white">
      {{ item.text }}
    </NuxtLink>
  </div>
</template>
