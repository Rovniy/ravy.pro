<script setup lang="ts">
import type { CategoryClassification, DisclosureOutcome, SteamAuditClassification } from '~/types/steam-audit'
import { computed } from 'vue'

const props = defineProps<{
  classification: SteamAuditClassification
}>()

interface Group {
  outcome: DisclosureOutcome
  title: string
  note?: string
  icon: string
  tone: string
  items: CategoryClassification[]
}

const groups = computed<Group[]>(() => {
  const by = (o: DisclosureOutcome) => props.classification.perCategory.filter(p => p.outcome === o)
  const defs: Array<Omit<Group, 'items'>> = [
    { outcome: 'pre', title: 'Disclose — Pre-Generated AI Content', icon: 'mdi:alert-circle', tone: 'rose', note: 'Created during development, ships in the build, consumed by players.' },
    { outcome: 'live', title: 'Disclose — Live-Generated AI Content', icon: 'mdi:robot', tone: 'amber', note: 'Generated at runtime. Valve also requires a description of your guardrails.' },
    { outcome: 'gray', title: 'Gray zone — review before you submit', icon: 'mdi:help-circle', tone: 'yellow', note: 'Valve discloses only what “ships with your game and is consumed by players”. When in doubt, disclose.' },
    { outcome: 'exempt', title: 'Likely exempt', icon: 'mdi:check-circle', tone: 'emerald', note: 'Development-only or efficiency-tool use — generally not disclosed.' },
  ]
  return defs
    .map(d => ({ ...d, items: by(d.outcome) }))
    .filter(g => g.items.length > 0)
})

const verdict = computed(() => {
  const c = props.classification
  if (c.mustDisclose) {
    return {
      headline: 'You need an AI disclosure for Steam',
      sub: c.hasLive
        ? 'You have runtime AI, so you must fill both the Pre-Generated and Live-Generated fields (with guardrails).'
        : 'Fill the Pre-Generated AI Content field in the Steamworks Content Survey.',
      tone: 'rose',
      icon: 'mdi:shield-alert',
    }
  }
  if (c.hasGray) {
    return {
      headline: 'Probably no disclosure — but check the gray areas',
      sub: 'Nothing clearly requires disclosure, yet some answers are ambiguous. Resolve them before you submit.',
      tone: 'yellow',
      icon: 'mdi:shield-half-full',
    }
  }
  return {
    headline: 'No AI disclosure required',
    sub: 'Based on your answers, nothing ships to players as AI-generated content. Keep a record in case Valve asks.',
    tone: 'emerald',
    icon: 'mdi:shield-check',
  }
})

const toneClasses: Record<string, { banner: string, dot: string, badge: string }> = {
  rose: {
    banner: 'border-danger/40 bg-danger/10',
    dot: 'bg-danger',
    badge: 'text-danger',
  },
  amber: {
    banner: 'border-warn/40 bg-warn/10',
    dot: 'bg-warn',
    badge: 'text-warn',
  },
  yellow: {
    banner: 'border-warn/40 bg-warn/10',
    dot: 'bg-warn',
    badge: 'text-warn',
  },
  emerald: {
    banner: 'border-ok/40 bg-ok/10',
    dot: 'bg-ok',
    badge: 'text-ok',
  },
}
</script>

<template>
  <div>
    <!-- Verdict banner -->
    <div class="border p-5 sm:p-6 flex items-start gap-4" :class="toneClasses[verdict.tone]!.banner">
      <Icon :name="verdict.icon" class="w-8 h-8 shrink-0" :class="toneClasses[verdict.tone]!.badge" />
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-fg">
          {{ verdict.headline }}
        </h2>
        <p class="mt-1 text-sm sm:text-base text-fg-muted leading-relaxed">
          {{ verdict.sub }}
        </p>
        <p class="mt-2 eyebrow">
          Checked against Valve policy v{{ classification.rulesetVersion }}
        </p>
      </div>
    </div>

    <!-- Grouped breakdown -->
    <div class="mt-5 space-y-4">
      <section
        v-for="g in groups"
        :key="g.outcome"
        class="border border-line bg-panel overflow-hidden"
      >
        <header class="flex items-center gap-2.5 px-5 py-3 border-b border-line">
          <span class="w-2.5 h-2.5 rounded-full" :class="toneClasses[g.tone]!.dot" />
          <h3 class="font-semibold text-fg">
            {{ g.title }}
          </h3>
          <span class="ml-auto font-spacemono text-xs text-fg-subtle">{{ g.items.length }}</span>
        </header>
        <p v-if="g.note" class="px-5 pt-3 text-sm text-fg-muted">
          {{ g.note }}
        </p>
        <ul class="px-5 py-3 space-y-3">
          <li v-for="item in g.items" :key="item.id" class="text-sm">
            <span class="font-medium text-fg">{{ item.label }}</span>
            <p class="mt-0.5 text-fg-muted leading-relaxed">
              {{ item.rationale }}
            </p>
            <p v-if="item.flag" class="mt-1 flex items-start gap-1.5 text-warn">
              <Icon name="mdi:flag-variant" class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ item.flag }}</span>
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
