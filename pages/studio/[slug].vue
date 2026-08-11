<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

useHead({
  title: slug.value === 'new' ? 'New post — Studio' : `Edit ${slug.value} — Studio`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-4xl">
    <header class="mb-6">
      <NuxtLink to="/studio" class="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white">
        <Icon name="mdi:arrow-left" size="14" />
        All posts
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-bold tracking-tight">
        {{ slug === 'new' ? 'New post' : 'Edit post' }}
      </h1>
    </header>

    <StudioGate>
      <StudioPostEditor :slug="slug" />
    </StudioGate>
  </div>
</template>
