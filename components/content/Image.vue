<script setup lang="ts">
defineProps([
  'imgSrc',
  'width',
])
</script>

<template>
  <NuxtImg
    :src="imgSrc"
    format="webp"
    quality="80"
    :width="width ? width : 720"
    class="mx-auto"
    loading="lazy"
    :modifiers="{ roundCorner: '0:100' }"
  />
</template>
