<script setup lang="ts">
defineProps(['imgSrc'])
</script>

<template>
  <NuxtImg
    :src="imgSrc"
    quality="80"
    width="720"
    loading="lazy"
    :modifiers="{ roundCorner: '0:100' }"
  />
</template>
