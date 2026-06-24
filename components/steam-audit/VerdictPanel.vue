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
    banner: 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30',
    dot: 'bg-rose-500',
    badge: 'text-rose-700 dark:text-rose-300',
  },
  amber: {
    banner: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
    dot: 'bg-amber-500',
    badge: 'text-amber-700 dark:text-amber-300',
  },
  yellow: {
    banner: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20',
    dot: 'bg-yellow-400',
    badge: 'text-yellow-700 dark:text-yellow-300',
  },
  emerald: {
    banner: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30',
    dot: 'bg-emerald-500',
    badge: 'text-emerald-700 dark:text-emerald-300',
  },
}
</script>

<template>
  <div>
    <!-- Verdict banner -->
    <div class="rounded-xl border p-5 sm:p-6 flex items-start gap-4" :class="toneClasses[verdict.tone]!.banner">
      <Icon :name="verdict.icon" class="w-8 h-8 shrink-0" :class="toneClasses[verdict.tone]!.badge" />
      <div>
        <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ verdict.headline }}
        </h2>
        <p class="mt-1 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
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
        class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
      >
        <header class="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 dark:border-slate-800">
          <span class="w-2.5 h-2.5 rounded-full" :class="toneClasses[g.tone]!.dot" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">
            {{ g.title }}
          </h3>
          <span class="ml-auto font-spacemono text-xs text-slate-400">{{ g.items.length }}</span>
        </header>
        <p v-if="g.note" class="px-5 pt-3 text-sm text-slate-500 dark:text-slate-400">
          {{ g.note }}
        </p>
        <ul class="px-5 py-3 space-y-3">
          <li v-for="item in g.items" :key="item.id" class="text-sm">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.label }}</span>
            <p class="mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
              {{ item.rationale }}
            </p>
            <p v-if="item.flag" class="mt-1 flex items-start gap-1.5 text-amber-700 dark:text-amber-300">
              <Icon name="mdi:flag-variant" class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{{ item.flag }}</span>
            </p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
