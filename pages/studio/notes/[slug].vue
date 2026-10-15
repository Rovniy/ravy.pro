<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

useHead({
  title: slug.value === 'new' ? 'New note — Studio' : `Edit note ${slug.value} — Studio`,
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <div class="px-6 lg:px-10 py-12 mx-auto w-full max-w-6xl">
    <header class="mb-6">
      <NuxtLink to="/studio?tab=notes" class="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
        <Icon name="mdi:arrow-left" size="14" />
        All notes
      </NuxtLink>
      <h1 class="mt-2 text-3xl font-display font-extrabold uppercase leading-none">
        {{ slug === 'new' ? 'New TIL note' : 'Edit TIL note' }}
      </h1>
    </header>

    <StudioGate>
      <StudioNoteEditor :slug="slug" />
    </StudioGate>
  </div>
</template>
