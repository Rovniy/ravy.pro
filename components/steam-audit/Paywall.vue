<script setup lang="ts">
import type { SteamAuditClassification } from '~/types/steam-audit'
import { computed } from 'vue'

const props = defineProps<{
  classification: SteamAuditClassification
  priceLabel: string
  loading?: boolean
  error?: string
  // Admin: the pack is unlocked without payment, so the offer drops the price.
  free?: boolean
}>()

defineEmits<{ (e: 'unlock'): void }>()

const benefits = computed(() => {
  const list = [
    'Paste-ready text for the Steamworks “Pre-Generated AI Content” field',
    `A dated PDF protocol — proof you reviewed against Valve policy v${props.classification.rulesetVersion}`,
    'Player-facing store disclosure, worded to minimise community backlash',
    'A private link to come back to your result anytime',
  ]
  if (props.classification.hasLive)
    list.splice(1, 0, '“Live-Generated AI Content” text + a ready guardrails statement')
  return list
})

// Blurred teaser cards — show the shape of the deliverable without the content.
const previewCards = computed(() => {
  const cards = [{ field: 'Pre-Generated AI Content', lines: 4 }]
  if (props.classification.hasLive) {
    cards.push({ field: 'Live-Generated AI Content', lines: 3 })
    cards.push({ field: 'Guardrails statement', lines: 2 })
  }
  cards.push({ field: 'Store-page disclosure', lines: 3 })
  return cards
})
</script>

<template>
  <div class="border border-line bg-panel overflow-hidden">
    <div class="grid grid-cols-1 md:grid-cols-2">
      <!-- Offer -->
      <div class="p-6 sm:p-7 border-b md:border-b-0 md:border-r border-line">
        <span class="eyebrow">{{ free ? 'Admin access · no payment' : 'Unlock your disclosure pack' }}</span>
        <h3 class="mt-2 text-xl font-bold tracking-tight text-fg">
          Ship the form with confidence
        </h3>
        <p class="mt-1.5 text-sm text-fg-muted">
          {{ free
            ? 'You’re signed in as the admin — generate the full pack for free, no checkout.'
            : 'Your verdict above is free. Unlock the ready-to-paste texts and the defensible paper trail.' }}
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
          <template v-if="free">
            {{ loading ? 'Generating your pack…' : 'Generate my pack — free' }}
          </template>
          <template v-else>
            {{ loading ? 'Opening secure checkout…' : `Unlock for ${priceLabel}` }}
          </template>
        </button>
        <p class="mt-2.5 text-center text-xs font-spacemono text-fg-subtle">
          {{ free ? 'Admin · free · no charge' : 'One-time · per game · secure Stripe checkout' }}
        </p>
        <p v-if="error" class="mt-3 text-sm text-danger text-center">
          {{ error }}
        </p>
      </div>

      <!-- Blurred preview -->
      <div class="relative p-6 sm:p-7 bg-panel-raised">
        <div class="space-y-4" aria-hidden="true">
          <div v-for="card in previewCards" :key="card.field" class="border border-line bg-panel p-3">
            <div class="font-spacemono text-micro text-fg-subtle mb-2">
              {{ card.field }}
            </div>
            <div class="space-y-1.5 select-none blur-[5px]">
              <div v-for="n in card.lines" :key="n" class="h-2.5 bg-line" :style="{ width: `${70 + (n * 37) % 30}%` }" />
            </div>
          </div>
        </div>
        <div class="absolute inset-0 grid place-items-center">
          <span class="flex items-center gap-1.5 bg-fg/90 text-bg px-3 py-1 text-xs font-spacemono">
            <Icon name="mdi:lock" class="w-3.5 h-3.5" />
            {{ free ? 'Unlocks instantly' : 'Unlocks after checkout' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
