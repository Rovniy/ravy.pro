<script setup lang="ts">
import { footerData } from '~/data'

const { track } = useAnalytics()
</script>

<template>
  <div>
    <p class="mb-4 flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
      <span class="inline-block w-1.5 h-3 bg-accent -skew-x-10" />
      {{ footerData.authorTitle }}
    </p>

    <p class="text-sm leading-relaxed text-fg-muted">
      {{ footerData.authorInterest }}
    </p>

    <NuxtLink
      to="/contacts"
      class="skew-box btn btn-primary btn-sm mt-5"
      @click="track('contact_click', { method: 'contacts_page' })"
    >
      <Icon name="mdi:card-account-details-outline" size="16" aria-hidden="true" />
      Contact Me
    </NuxtLink>
  </div>
</template>
