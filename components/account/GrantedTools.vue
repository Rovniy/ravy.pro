<script setup lang="ts">
import { useAccess } from '~/composables/useAccess'

/**
 * Links to the gated tools this account can actually use.
 *
 * They also appear in the header's Tools dropdown, but that menu is easy to
 * miss and this is the page someone lands on after being granted access — the
 * Access tab is right here, so the thing it unlocks should be too.
 *
 * Driven by `accessibleServices`, which filters `GATED_TOOLS` (data/services.ts)
 * by the same `hasTool` check the server enforces. Granting a new tool needs no
 * edit here.
 */
const { accessibleServices } = useAccess()
</script>

<template>
  <!-- Spacing lives here, not on the tabs below, so an account with no grants
       gets exactly the layout it had before. -->
  <section v-if="accessibleServices.length" class="mb-6">
    <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      Your tools
    </h2>
    <div class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="tool in accessibleServices"
        :key="tool.key"
        :to="tool.path"
        class="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      >
        <Icon :name="tool.icon" size="16" aria-hidden="true" />
        {{ tool.name }}
        <Icon name="mdi:arrow-right" size="14" aria-hidden="true" class="text-slate-400" />
      </NuxtLink>
    </div>
  </section>
</template>
