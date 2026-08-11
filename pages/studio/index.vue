<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Studio',
  meta: [
    { name: 'description', content: 'Internal panel for writing and publishing blog posts.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-4xl">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        Studio
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Posts are stored in Firestore and go live within a minute of saving — no deploy.
      </p>
    </header>

    <StudioGate>
      <StudioPostList />
    </StudioGate>
  </div>
</template>
