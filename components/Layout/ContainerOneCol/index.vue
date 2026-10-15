<script setup lang="ts">
</script>

<template>
  <!-- Same 6xl grid as the header, so the text column starts on the logo's
       edge; the prose itself keeps a readable measure. -->
  <LayoutContainer class="py-10">
    <div
      class="prose prose-img:mx-auto prose-img:block prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
      prose-h1:no-underline max-w-3xl prose-slate dark:prose-invert"
    >
      <slot />
    </div>
  </LayoutContainer>
</template>
