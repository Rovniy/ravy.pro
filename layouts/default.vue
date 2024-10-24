<script setup lang="ts">
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
