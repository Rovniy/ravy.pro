<script setup lang="ts">
import type { ContractScanTeaser } from '~/types/contract-scan'
import { computed } from 'vue'

const props = defineProps<{
  teaser: ContractScanTeaser
  priceLabel: string
  loading?: boolean
  error?: string
}>()

defineEmits<{ (e: 'unlock'): void }>()

const riskTone: Record<string, string> = {
  low: 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30',
  medium: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
  high: 'text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30',
  critical: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30',
}

const score = computed(() => props.teaser.overallRiskScore?.score || 'medium')
const counts = computed(() => props.teaser.redFlagCounts || { high: 0, medium: 0, low: 0, total: 0 })

// Blurred placeholder rows — one per detected flag (capped) to convey "there is
// real detail here" without revealing it.
const previewRows = computed(() => {
  const n = Math.min(Math.max(counts.value.total, 3), 6)
  return Array.from({ length: n }, (_, i) => 2 + (i % 3))
})

const benefits = [
  'Every flagged clause — with the exact quote and why it is risky',
  'What each clause means for you as the creator',
  'A concrete suggested fix / safer wording for each red flag',
  'Your negotiation priorities and fallback positions',
  'A private link to come back to your full report anytime',
]
</script>

<template>
  <div class="space-y-6">
    <!-- Free verdict -->
    <div class="rounded-xl border p-5 sm:p-6" :class="riskTone[score] || riskTone.medium">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="eyebrow">Free risk check</span>
          <p class="mt-1 text-2xl font-bold tracking-tight capitalize">
            {{ score }} risk
          </p>
        </div>
        <div v-if="teaser.jurisdiction" class="text-right text-sm">
          <span class="block text-slate-500 dark:text-slate-400">Jurisdiction</span>
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ teaser.jurisdiction }}</span>
        </div>
      </div>
      <p v-if="teaser.overallRiskScore?.reason" class="mt-3 text-sm text-slate-700 dark:text-slate-200">
        {{ teaser.overallRiskScore.reason }}
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-3 py-1 text-sm font-medium">
          {{ counts.high }} high
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-3 py-1 text-sm font-medium">
          {{ counts.medium }} medium
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 text-sm font-medium">
          {{ counts.low }} low
        </span>
      </div>

      <p v-if="teaser.summary" class="mt-4 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {{ teaser.summary }}
      </p>
    </div>

    <!-- Paywall -->
    <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-2">
        <!-- Offer -->
        <div class="p-6 sm:p-7 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800">
          <span class="eyebrow">Unlock the full report</span>
          <h3 class="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {{ counts.total }} red flag{{ counts.total === 1 ? '' : 's' }} found — see the details
          </h3>
          <p class="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            The risk check above is free. Unlock the clause-by-clause breakdown and how to fix it.
          </p>

          <ul class="mt-5 space-y-2.5">
            <li v-for="b in benefits" :key="b" class="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-200">
              <Icon name="mdi:check-circle" class="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{{ b }}</span>
            </li>
          </ul>

          <button
            type="button"
            :disabled="loading"
            class="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer transition"
            @click="$emit('unlock')"
          >
            <Icon :name="loading ? 'svg-spinners:180-ring' : 'mdi:lock-open-variant'" class="w-5 h-5" />
            {{ loading ? 'Opening secure checkout…' : `Unlock full report for ${priceLabel}` }}
          </button>
          <p class="mt-2.5 text-center text-xs font-spacemono text-slate-400">
            One-time · per scan · secure Stripe checkout
          </p>
          <p v-if="error" class="mt-3 text-sm text-rose-600 dark:text-rose-400 text-center">
            {{ error }}
          </p>
        </div>

        <!-- Blurred preview -->
        <div class="relative p-6 sm:p-7 bg-slate-50 dark:bg-slate-950/40">
          <div class="space-y-4" aria-hidden="true">
            <div v-for="(lines, idx) in previewRows" :key="idx" class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
              <div class="font-spacemono text-[11px] text-slate-400 mb-2">
                Red flag #{{ idx + 1 }}
              </div>
              <div class="space-y-1.5 select-none blur-[5px]">
                <div v-for="n in lines" :key="n" class="h-2.5 rounded bg-slate-200 dark:bg-slate-700" :style="{ width: `${70 + (n * 37) % 30}%` }" />
              </div>
            </div>
          </div>
          <div class="absolute inset-0 grid place-items-center">
            <span class="flex items-center gap-1.5 rounded-full bg-slate-900/80 dark:bg-white/90 text-white dark:text-slate-900 px-3 py-1 text-xs font-spacemono">
              <Icon name="mdi:lock" class="w-3.5 h-3.5" />
              Unlocks after checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
