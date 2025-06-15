<script setup lang="ts">
import { footerData } from '~/data'
</script>

<template>
  <div class="border-t dark:border-gray-800 text-center py-4 flex justify-center gap-6">
    {{ footerData.copyright }}

    <a href="/rss.xml">
      <Icon name="bi:rss-fill" class="hover:text-white" />
      <span class="sr-only">Subscribe to RSS Feed</span>
    </a>
  </div>
</template>

<style scoped lang="sass">

</style>
