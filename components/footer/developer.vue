<script setup lang="ts">
import { footerData, socialNetworks } from '~/data'
</script>

<template>
  <div>
    <p class="text-black dark:text-zinc-300 text-2xl py-1 font-semibold" v-text="footerData.author" />

    <p class="py-2 dark:text-zinc-300" v-text="footerData.aboutAuthor" />

    <div class="my-3 space-x-3 pb-3">
      <NuxtLink
        v-for="item in socialNetworks"
        :key="item.name"
        :to="item.href"
        target="_blank"
        class="p-2 bg-gray-300 text-gray-800 rounded-md dark:bg-sky-700 dark:text-[#F1F2F4]"
        :aria-label="item.name"
      >
        <Icon :name="item.icon" size="1em" />
      </NuxtLink>
    </div>
  </div>
</template>
