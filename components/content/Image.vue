<script setup lang="ts">
defineProps([
  'imgSrc',
  'width',
])
</script>

<template>
  <NuxtImg
    :src="imgSrc"
    quality="80"
    :width="width ? width : 720"
    sizes="(max-width: 768px) 100vw, 720px"
    class="mx-auto"
    loading="lazy"
    :modifiers="{ roundCorner: '0:100' }"
  />
</template>
