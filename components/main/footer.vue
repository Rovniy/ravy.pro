<script setup lang="ts">
const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer>
    <div class="pt-5 border-t dark:border-gray-800  mt-5 text-zinc-700 dark:text-zinc-300">
      <div class="px-6 container max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3">
          <FooterSite v-if="path === 'about'" />
          <FooterSocial v-else />
          <FooterLink />
          <FooterConnect />
        </div>

        <FooterSemiLinks />

        <FooterCopyright />
      </div>
    </div>
  </footer>
</template>

<style>
/* we will explain what these classes do next! */
.v-enter-active,
.v-leave-active {
  transition: all 0.4s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
</style>
