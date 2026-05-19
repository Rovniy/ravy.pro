<script setup lang="ts">
import type { ContractScanResult } from '~/types/contract-scan'

const props = defineProps<{
  result: ContractScanResult
}>()

const severityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 }
const sortedRedFlags = computed(() => {
  const flags = props.result?.redFlags || []
  return [...flags].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
})
const flaggedCount = computed(() => props.result?.redFlags?.length || 0)
const highCount = computed(() => props.result?.redFlags?.filter(item => item.severity === 'high').length || 0)

function jurisdictionFlag(jurisdiction: string) {
  const j = jurisdiction.toLowerCase()
  if (j.includes('united states') || j.includes('usa') || j.includes('us'))
    return '🇺🇸'
  if (j.includes('european union') || j.includes('eu'))
    return '🇪🇺'
  if (j.includes('united kingdom') || j.includes('uk'))
    return '🇬🇧'
  if (j.includes('uae') || j.includes('united arab emirates'))
    return '🇦🇪'
  return '🌐'
}

function severityIcon(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high')
    return 'mdi:alert-octagon'
  if (severity === 'medium')
    return 'mdi:alert'
  return 'mdi:information'
}
</script>

<template>
  <section class="mt-8 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 bg-white dark:bg-slate-900">
    <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
      <Icon name="mdi:file-search-outline" size="20" />
      Scan Results
    </h2>
    <p class="mt-1 text-base text-zinc-600 dark:text-zinc-400">
      Found {{ flaggedCount }} potential red flags, including {{ highCount }} high-risk items.
    </p>
    <div class="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 bg-zinc-50/60 dark:bg-zinc-900/40">
      <p class="text-zinc-500 dark:text-zinc-400 text-sm flex items-center gap-2">
        <Icon name="mdi:gauge" size="16" />
        Overall risk
      </p>
      <p class="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
        {{ result.overallRiskScore.score }}
      </p>
      <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        {{ result.overallRiskScore.reason }}
      </p>
    </div>
    <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/40 dark:bg-zinc-900/30">
        <p class="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <Icon name="mdi:translate" size="16" />
          Language
        </p>
        <p class="font-medium text-zinc-900 dark:text-zinc-100">
          {{ result.language }}
        </p>
      </div>
      <div class="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-zinc-50/40 dark:bg-zinc-900/30">
        <p class="text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <span>{{ jurisdictionFlag(result.jurisdiction) }}</span>
          Jurisdiction
        </p>
        <p class="font-medium text-zinc-900 dark:text-zinc-100">
          {{ result.jurisdiction }}
        </p>
      </div>
    </div>
    <p class="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
      {{ result.summary }}
    </p>

    <div v-if="result.narrowPoints?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:tune-vertical" size="16" />
        Narrow Points
      </h3>
      <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
        <li v-for="(point, idx) in result.narrowPoints" :key="`${idx}-${point.slice(0, 20)}`">
          {{ point }}
        </li>
      </ul>
    </div>

    <div v-if="result.hiddenRisks?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:eye-off-outline" size="16" />
        Hidden Risks
      </h3>
      <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
        <li v-for="(risk, idx) in result.hiddenRisks" :key="`${idx}-${risk.slice(0, 20)}`">
          {{ risk }}
        </li>
      </ul>
    </div>

    <div v-if="result.missingProtections?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:shield-alert-outline" size="16" />
        Missing Protections
      </h3>
      <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
        <li v-for="(risk, idx) in result.missingProtections" :key="`${idx}-${risk.slice(0, 20)}`">
          {{ risk }}
        </li>
      </ul>
    </div>

    <div v-if="result.questionsToClarify?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:help-circle-outline" size="16" />
        Questions to Clarify
      </h3>
      <ul class="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300 list-disc pl-5">
        <li v-for="(q, idx) in result.questionsToClarify" :key="`${idx}-${q.slice(0, 20)}`">
          {{ q }}
        </li>
      </ul>
    </div>

    <div v-if="result.creatorNegotiationPriorities?.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:handshake-outline" size="16" />
        Negotiation Priorities
      </h3>
      <div class="mt-2 space-y-3">
        <article
          v-for="(item, idx) in result.creatorNegotiationPriorities"
          :key="`${idx}-${item.priority}`"
          class="rounded-md border border-zinc-200 dark:border-zinc-700 p-3"
        >
          <p class="font-medium text-zinc-900 dark:text-zinc-100">
            {{ item.priority }}
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {{ item.whyItMatters }}
          </p>
          <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Fallback: {{ item.fallbackPosition }}
          </p>
        </article>
      </div>
    </div>

    <div v-if="sortedRedFlags.length" class="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
      <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
        <Icon name="mdi:alert-decagram-outline" size="16" />
        Red Flags (sorted by severity)
      </h3>
      <article
        v-for="(item, idx) in sortedRedFlags"
        :key="`${idx}-${item.title}`"
        class="rounded-lg border p-4"
        :class="item.severity === 'high'
          ? 'border-red-300 dark:border-red-700 bg-red-50/70 dark:bg-red-950/20'
          : item.severity === 'medium'
            ? 'border-amber-300 dark:border-amber-700 bg-amber-50/70 dark:bg-amber-950/20'
            : 'border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-900/40'"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Icon :name="severityIcon(item.severity)" size="16" />
            {{ item.title }}
          </h3>
          <span class="text-xs uppercase font-semibold" :class="item.severity === 'high' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'">
            {{ item.severity }}
          </span>
        </div>
        <p class="mt-2 text-sm text-zinc-700 dark:text-zinc-300 break-words">
          Clause: <code class="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 break-words">{{ item.clauseQuote }}</code>
        </p>
        <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Risk type: <span class="font-medium">{{ item.riskType }}</span>
        </p>
        <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          {{ item.whyRisky }}
        </p>
        <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Creator impact: {{ item.creatorImpact }}
        </p>
        <p class="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Suggested action: {{ item.suggestion }}
        </p>
      </article>
    </div>

    <p v-else class="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
      No obvious red flags matched these patterns. This does not mean the contract is safe.
    </p>
  </section>
</template>
