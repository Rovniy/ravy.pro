<script setup lang="ts">
const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer class="relative mt-8 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-slate-950/40">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-sky-400/0 via-sky-400/60 to-violet-500/0 pointer-events-none" />

    <div class="px-6 container max-w-5xl mx-auto py-12 md:py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
        <FooterSite v-if="path === 'about'" />
        <FooterSocial v-else />
        <FooterLink />
        <FooterConnect />
      </div>

      <div class="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <FooterCopyright />
        <FooterSemiLinks />
      </div>
    </div>
  </footer>
</template>
