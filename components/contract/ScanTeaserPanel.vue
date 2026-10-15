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
  low: 'text-ok border-ok/40 bg-ok/10',
  medium: 'text-warn border-warn/40 bg-warn/10',
  high: 'text-warn border-warn/40 bg-warn/10',
  critical: 'text-danger border-danger/40 bg-danger/10',
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
    <div class="border p-5 sm:p-6" :class="riskTone[score] || riskTone.medium">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="eyebrow">Free risk check</span>
          <p class="mt-1 text-2xl font-bold tracking-tight capitalize">
            {{ score }} risk
          </p>
        </div>
        <div v-if="teaser.jurisdiction" class="text-right text-sm">
          <span class="block text-fg-muted">Jurisdiction</span>
          <span class="font-medium text-fg">{{ teaser.jurisdiction }}</span>
        </div>
      </div>
      <p v-if="teaser.overallRiskScore?.reason" class="mt-3 text-sm text-fg">
        {{ teaser.overallRiskScore.reason }}
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1.5 bg-danger/10 text-danger px-3 py-1 text-sm font-medium">
          {{ counts.high }} high
        </span>
        <span class="inline-flex items-center gap-1.5 bg-warn/10 text-warn px-3 py-1 text-sm font-medium">
          {{ counts.medium }} medium
        </span>
        <span class="inline-flex items-center gap-1.5 bg-panel-raised text-fg-muted px-3 py-1 text-sm font-medium">
          {{ counts.low }} low
        </span>
      </div>

      <p v-if="teaser.summary" class="mt-4 text-sm text-fg leading-relaxed">
        {{ teaser.summary }}
      </p>
    </div>

    <!-- Paywall -->
    <div class="border border-line bg-panel overflow-hidden">
      <div class="grid grid-cols-1 md:grid-cols-2">
        <!-- Offer -->
        <div class="p-6 sm:p-7 border-b md:border-b-0 md:border-r border-line">
          <span class="eyebrow">Unlock the full report</span>
          <h3 class="mt-2 text-xl font-bold tracking-tight text-fg">
            {{ counts.total }} red flag{{ counts.total === 1 ? '' : 's' }} found — see the details
          </h3>
          <p class="mt-1.5 text-sm text-fg-muted">
            The risk check above is free. Unlock the clause-by-clause breakdown and how to fix it.
          </p>

          <ul class="mt-5 space-y-2.5">
            <li v-for="b in benefits" :key="b" class="flex items-start gap-2.5 text-sm text-fg">
              <Icon name="mdi:check-circle" class="w-5 h-5 shrink-0 text-ok" />
              <span>{{ b }}</span>
            </li>
          </ul>

          <button
            type="button"
            :disabled="loading"
            class="skew-box btn btn-primary mt-6 w-full disabled:cursor-not-allowed"
            @click="$emit('unlock')"
          >
            <Icon :name="loading ? 'svg-spinners:180-ring' : 'mdi:lock-open-variant'" class="w-5 h-5" />
            {{ loading ? 'Opening secure checkout…' : `Unlock full report for ${priceLabel}` }}
          </button>
          <p class="mt-2.5 text-center text-xs font-spacemono text-fg-subtle">
            One-time · per scan · secure Stripe checkout
          </p>
          <p v-if="error" class="mt-3 text-sm text-danger text-center">
            {{ error }}
          </p>
        </div>

        <!-- Blurred preview -->
        <div class="relative p-6 sm:p-7 bg-panel-raised">
          <div class="space-y-4" aria-hidden="true">
            <div v-for="(lines, idx) in previewRows" :key="idx" class="border border-line bg-panel p-3">
              <div class="font-spacemono text-micro text-fg-subtle mb-2">
                Red flag #{{ idx + 1 }}
              </div>
              <div class="space-y-1.5 select-none blur-[5px]">
                <div v-for="n in lines" :key="n" class="h-2.5 bg-line" :style="{ width: `${70 + (n * 37) % 30}%` }" />
              </div>
            </div>
          </div>
          <div class="absolute inset-0 grid place-items-center">
            <span class="flex items-center gap-1.5 bg-fg/90 text-bg px-3 py-1 text-xs font-spacemono">
              <Icon name="mdi:lock" class="w-3.5 h-3.5" />
              Unlocks after checkout
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
