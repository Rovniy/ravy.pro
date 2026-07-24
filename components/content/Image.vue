<script setup lang="ts">
defineProps([
  'imgSrc',
  'width',
  // Intrinsic height matching `width` — reserves layout space so the image
  // doesn't shift content when it loads (CLS).
  'height',
])
</script>

<template>
  <NuxtImg
    :src="imgSrc"
    quality="80"
    :width="width ? width : 720"
    :height="height"
    sizes="(max-width: 768px) 100vw, 720px"
    class="mx-auto"
    loading="lazy"
    :modifiers="{ roundCorner: '0:100' }"
  />
</template>
