<script setup lang="ts">
import type { ContractScanResult } from '~/types/contract-scan'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Shared Contract Scan Report',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'description', content: 'Shared contract scan report.' },
  ],
})

const shareId = useRoute().params.shareId as string

const { data, status, error } = await useAsyncData(`scan-share-${shareId}`, () =>
  $fetch<{ result: ContractScanResult, createdAt?: string }>(`/api/contract-scanner/shared/${shareId}`))
</script>

<template>
  <div class="px-6 lg:px-10 py-8 sm:py-12 mx-auto w-full max-w-6xl">
    <header class="mb-4">
      <h1 class="text-3xl sm:text-4xl font-display font-extrabold uppercase text-fg leading-none">
        Shared Scan Report
      </h1>
      <p class="mt-2 text-sm text-fg-muted">
        This page contains analysis results only. Original document text is not displayed.
      </p>
    </header>

    <div v-if="status === 'pending'" class="text-fg-muted">
      Loading…
    </div>
    <div v-else-if="error || !data?.result" class="border border-danger/40 bg-danger/10 p-4">
      <p class="text-danger">
        Shared report not found or unavailable.
      </p>
    </div>
    <ContractScanResultPanel v-else :result="data.result" />
  </div>
</template>
