<script setup lang="ts">
</script>

<template>
  <div class="p-6 container max-w-5xl mx-auto sm:grid grid-cols-12 gap-x-12 ">
    <div class="col-span-12 lg:col-span-12">
      <div
        class="prose prose-img:mx-auto prose-img:block prose-pre:max-w-xs sm:prose-pre:max-w-full prose-sm sm:prose-base md:prose-lg
        prose-h1:no-underline max-w-5xl mx-auto prose-zinc dark:prose-invert prose-img:rounded-lg"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
