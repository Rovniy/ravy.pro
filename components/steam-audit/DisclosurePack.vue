<script setup lang="ts">
import type { SteamAuditClassification, SteamAuditResult } from '~/types/steam-audit'
import { computed, ref } from 'vue'

const props = defineProps<{
  result: SteamAuditResult
  classification: SteamAuditClassification
}>()

interface PackCard {
  key: string
  field: string
  where: string
  text: string
  empty: string
}

const cards = computed<PackCard[]>(() => {
  const list: PackCard[] = [{
    key: 'pre',
    field: 'Pre-Generated AI Content',
    where: 'Steamworks → Content Survey → Generative AI → Pre-Generated description',
    text: props.result.preGeneratedText,
    empty: 'No pre-generated AI content to disclose — leave this field blank.',
  }]

  if (props.classification.hasLive) {
    list.push({
      key: 'live',
      field: 'Live-Generated AI Content',
      where: 'Steamworks → Content Survey → Generative AI → Live-Generated description',
      text: props.result.liveGeneratedText,
      empty: 'No live-generated content.',
    })
    list.push({
      key: 'guardrails',
      field: 'Live-Generated — guardrails',
      where: 'Same section → describe the guardrails preventing illegal content',
      text: props.result.liveGuardrailsText,
      empty: 'Describe your runtime guardrails here.',
    })
  }

  list.push({
    key: 'store',
    field: 'Store-page disclosure (player-facing)',
    where: 'Shown to players on your store page as the AI disclosure',
    text: props.result.storePublicText,
    empty: 'No player-facing disclosure needed.',
  })

  return list
})

const copiedKey = ref('')
async function copy(card: PackCard) {
  if (!card.text)
    return
  try {
    await navigator.clipboard.writeText(card.text)
    copiedKey.value = card.key
    setTimeout(() => {
      if (copiedKey.value === card.key)
        copiedKey.value = ''
    }, 2200)
  }
  catch {
    // clipboard unavailable — user can still select the text manually
  }
}
</script>

<template>
  <div class="space-y-4">
    <article
      v-for="card in cards"
      :key="card.key"
      class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <header class="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">
            {{ card.field }}
          </h3>
          <p class="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400 font-spacemono">
            <Icon name="mdi:map-marker-outline" class="w-3.5 h-3.5 shrink-0" />
            {{ card.where }}
          </p>
        </div>
        <button
          type="button"
          :disabled="!card.text"
          class="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer transition"
          @click="copy(card)"
        >
          <Icon :name="copiedKey === card.key ? 'mdi:check' : 'mdi:content-copy'" class="w-4 h-4" :class="copiedKey === card.key ? 'text-emerald-500' : ''" />
          {{ copiedKey === card.key ? 'Copied' : 'Copy' }}
        </button>
      </header>
      <div class="px-5 py-4">
        <p v-if="card.text" class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          {{ card.text }}
        </p>
        <p v-else class="text-sm italic text-slate-400">
          {{ card.empty }}
        </p>
      </div>
    </article>

    <!-- Community phrasing tips -->
    <section
      v-if="result.communityPhrasingNotes.length"
      class="rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-sky-950/20 p-5"
    >
      <h3 class="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
        <Icon name="mdi:lightbulb-on-outline" class="w-5 h-5 text-sky-500" />
        Wording tips to avoid backlash
      </h3>
      <ul class="mt-3 space-y-2">
        <li v-for="(tip, i) in result.communityPhrasingNotes" :key="i" class="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Icon name="mdi:circle-small" class="w-5 h-5 shrink-0 -ml-1 text-sky-500" />
          <span>{{ tip }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
