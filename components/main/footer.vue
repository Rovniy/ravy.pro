<script setup lang="ts">
const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer class="border-t border-zinc-200 dark:border-zinc-800 mt-8">
    <div class="px-6 container max-w-5xl mx-auto py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        <FooterSite v-if="path === 'about'" />
        <FooterSocial v-else />
        <FooterLink />
        <FooterConnect />
      </div>

      <FooterSemiLinks />
      <FooterCopyright />
    </div>
  </footer>
</template>
