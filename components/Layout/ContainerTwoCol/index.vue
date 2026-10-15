<script setup lang="ts">
</script>

<template>
  <!-- Text plus a side rail (the table of contents) on the header's 6xl grid. -->
  <LayoutContainer class="py-10 lg:grid grid-cols-12 gap-x-12">
    <div class="col-span-12 lg:col-span-9 min-w-0">
      <div
        class="prose prose-img:mx-auto prose-img:block prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
        prose-h1:no-underline max-w-none prose-slate dark:prose-invert"
      >
        <slot name="default" />
      </div>
    </div>

    <slot name="col" />
  </LayoutContainer>
</template>
