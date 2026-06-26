<script setup lang="ts">
const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer class="relative mt-8 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/40 to-transparent pointer-events-none" />

    <div class="px-6 container max-w-5xl mx-auto py-12 md:py-16">
      <FooterNewsletter class="mb-10 pb-10 border-b border-slate-200 dark:border-slate-800" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
        <FooterSite v-if="path === 'about'" />
        <FooterSocial v-else />
        <FooterLink />
        <FooterConnect />
      </div>

      <div class="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <FooterCopyright />
        <FooterSemiLinks />
      </div>
    </div>
  </footer>
</template>
