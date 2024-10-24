<script setup lang="ts">
import { footerData } from '~/data'

const route = useRoute()

const path = computed(() => route.fullPath.replace('/', ''))
</script>

<template>
  <footer>
    <div class="py-5 border-t dark:border-gray-800  mt-5 text-zinc-700 dark:text-zinc-300">
      <div class="px-6 container max-w-5xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3">
          <FooterSite v-if="path === 'about'" />
          <FooterSocial v-else />
          <FooterLink />
          <FooterConnect />
        </div>

        <div class="border-t dark:border-gray-800 mt-5 text-center p-2">
          {{ footerData.copyright }}

          <a href="/rss.xml">
            <span class="px-3">
              <Icon name="bi:rss-fill" class="hover:text-white" />
            </span>
            <span class="sr-only">Subscribe to RSS Feed</span>
          </a>
        </div>
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
