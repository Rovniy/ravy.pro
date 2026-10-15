<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()
const router = useRouter()
const tab = computed(() => (route.query.tab === 'notes' ? 'notes' : 'posts'))

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
      <h1 class="text-4xl font-display font-extrabold uppercase leading-none">
        Studio
      </h1>
      <p class="text-sm text-fg-muted mt-1">
        Posts and TIL notes are stored in Firestore and go live within a minute of saving — no deploy.
      </p>
    </header>

    <StudioGate>
      <StudioClaudeConnect />
      <div class="mb-6 inline-flex border border-line p-1" role="tablist">
        <button
          v-for="t in [{ id: 'posts', label: 'Posts' }, { id: 'notes', label: 'TIL notes' }]"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="tab === t.id"
          class="px-4 py-1.5 text-sm font-medium transition-colors hover:cursor-pointer"
          :class="tab === t.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-fg-muted'"
          @click="router.replace({ query: { ...route.query, tab: t.id === 'posts' ? undefined : t.id } })"
        >
          {{ t.label }}
        </button>
      </div>
      <StudioNoteList v-if="tab === 'notes'" />
      <StudioPostList v-else />
    </StudioGate>
  </div>
</template>
