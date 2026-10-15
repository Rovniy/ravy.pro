<script setup lang="ts">
const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer class="relative mt-8 border-t-2 border-line-strong bg-panel">
    <div class="absolute left-0 top-0 h-1 w-24 bg-accent" aria-hidden="true" />

    <LayoutContainer class="py-12 md:py-16">
      <FooterNewsletter class="mb-10 pb-10 border-b border-line" />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10">
        <FooterSite v-if="path === 'about'" />
        <FooterSocial v-else />
        <FooterLink />
        <FooterConnect />
      </div>

      <div class="mt-12 pt-6 border-t border-line flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4">
        <FooterCopyright />
        <FooterSemiLinks />
      </div>
    </LayoutContainer>
  </footer>
</template>
