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
  <main class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <header class="mb-4">
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Shared Scan Report
      </h1>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
        This page contains analysis results only. Original document text is not displayed.
      </p>
    </header>

    <div v-if="status === 'pending'" class="text-slate-500">
      Loading…
    </div>
    <div v-else-if="error || !data?.result" class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-4">
      <p class="text-red-700 dark:text-red-300">
        Shared report not found or unavailable.
      </p>
    </div>
    <ContractScanResultPanel v-else :result="data.result" />
  </main>
</template>
