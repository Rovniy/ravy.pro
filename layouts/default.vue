<script setup lang="ts">
useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/ico',
      href: '/favicon.ico',
    },
  ],
})
</script>

<template>
  <div class="gd-container font-spacegrotesk">
    <MainHeader />

    <main>
      <div class="p-9" />
      <slot />
    </main>

    <LazyMainFooter />
  </div>
</template>

<style scoped>
.gd-container {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
}
</style>
