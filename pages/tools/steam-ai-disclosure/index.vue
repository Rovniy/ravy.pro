<script setup lang="ts">
import type { SteamAuditAnswers, SteamAuditClassification } from '~/types/steam-audit'
import { computed, ref } from 'vue'
import { classifyAudit, RULESET_VERSION } from '~/utils/steam-ai-ruleset'

definePageMeta({ layout: 'default' })

useToolPageSchema({
  path: '/tools/steam-ai-disclosure',
  title: 'Steam AI Disclosure Generator & Audit',
  description: 'Answer a few plain-language questions and get a correct, paste-ready Steam AI content disclosure — Pre-Generated, Live-Generated, and store-page text — plus a dated compliance protocol. Matches Valve policy.',
  appName: 'Steam AI Disclosure Generator',
  appCategory: 'DeveloperApplication',
  appDescription: 'Generates a correct Steamworks AI content disclosure and a dated compliance protocol for game developers.',
  appIsFree: false,
  faq: [
    { question: 'What does Steam require me to disclose?', answer: 'Valve\'s Content Survey asks you to disclose AI-generated content that ships with your game and is consumed by players, split into Pre-Generated (made during development) and Live-Generated (made at runtime). Behind-the-scenes efficiency tools are not the focus.' },
    { question: 'Is this legal advice?', answer: 'No. This tool helps you complete and document Steam\'s AI disclosure based on the current policy. It is informational, not legal advice.' },
    { question: 'Why pay if ChatGPT can write text?', answer: 'You pay for a verdict matched to Valve\'s current ruleset, a dated proof-of-good-faith protocol, and wording tuned to avoid community backlash — not for three paragraphs.' },
    { question: 'What do I get?', answer: 'Paste-ready text for each Steamworks field, a player-facing store disclosure, and a downloadable dated protocol documenting what you reviewed.' },
  ],
})

const config = useRuntimeConfig()
const priceLabel = computed(() => {
  const raw = (config.public as Record<string, any>)?.steamAudit?.priceUsd
  const value = (typeof raw === 'string' && raw.trim()) ? raw.trim() : '39'
  return `$${value}`
})

type Stage = 'intro' | 'wizard' | 'verdict'
const stage = ref<Stage>('intro')
const answers = ref<SteamAuditAnswers>({})
const classification = ref<SteamAuditClassification | null>(null)
const gameName = ref('')

const checkoutLoading = ref(false)
const checkoutError = ref('')

const steps = [
  { icon: 'mdi:format-list-checks', title: 'Answer 10 quick questions', text: 'Plain language, per asset type. No uploads, no account.' },
  { icon: 'mdi:scale-balance', title: 'Get your verdict — free', text: 'See exactly what must be disclosed, what\'s exempt, and the gray areas.' },
  { icon: 'mdi:file-document-check', title: 'Unlock the paste-ready pack', text: 'Ready Steamworks texts + a dated compliance protocol.' },
]

function startWizard() {
  checkoutError.value = ''
  stage.value = 'wizard'
}

function onComplete(result: SteamAuditAnswers) {
  answers.value = result
  classification.value = classifyAudit(result)
  stage.value = 'verdict'
  if (import.meta.client)
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

function restart() {
  answers.value = {}
  classification.value = null
  stage.value = 'intro'
}

async function startCheckout() {
  if (checkoutLoading.value)
    return
  checkoutLoading.value = true
  checkoutError.value = ''
  try {
    const res = await $fetch<{ url: string }>('/api/steam-audit/checkout', {
      method: 'POST',
      body: { answers: answers.value, gameName: gameName.value.trim() || undefined },
    })
    if (!res?.url)
      throw new Error('Checkout could not be created')
    window.location.href = res.url
  }
  catch (e: unknown) {
    checkoutError.value = e instanceof Error ? e.message : 'Failed to open checkout. Please try again.'
    checkoutLoading.value = false
  }
}
</script>

<template>
  <div class="px-4 sm:px-6 py-8 sm:py-12 mx-auto w-full max-w-5xl">
    <!-- Hero -->
    <header class="max-w-3xl">
      <span class="eyebrow">Steam · AI content disclosure</span>
      <h1 class="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
        Get your Steam AI disclosure right in 10 minutes
      </h1>
      <p class="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
        Valve now reviews — and can delist — games over a wrong AI disclosure. Answer a few plain-language
        questions and get exactly what to put in the Steamworks form, plus a dated paper trail.
      </p>
      <p class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 eyebrow">
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Not legal advice</span>
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Matches Valve policy v{{ RULESET_VERSION }}</span>
        <span class="flex items-center gap-1.5"><Icon name="mdi:check" class="w-3.5 h-3.5 text-emerald-500" /> Free verdict, no account</span>
      </p>
    </header>

    <!-- Intro: how it works + CTA -->
    <template v-if="stage === 'intro'">
      <div class="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="(s, i) in steps"
          :key="s.title"
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
        >
          <div class="flex items-center gap-2">
            <span class="font-spacemono text-xs text-sky-500">0{{ i + 1 }}</span>
            <Icon :name="s.icon" class="w-5 h-5 text-sky-500" />
          </div>
          <h3 class="mt-3 font-semibold text-slate-900 dark:text-slate-100">
            {{ s.title }}
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ s.text }}
          </p>
        </div>
      </div>

      <div class="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 font-medium hover:opacity-90 hover:cursor-pointer transition"
          @click="startWizard"
        >
          <Icon name="mdi:rocket-launch-outline" class="w-5 h-5" />
          Check your game — free
        </button>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Takes ~3 minutes · you only pay if you want the ready-to-paste pack.
        </p>
      </div>
    </template>

    <!-- Wizard -->
    <div v-else-if="stage === 'wizard'" class="mt-8">
      <SteamAuditWizard @complete="onComplete" @cancel="restart" />
    </div>

    <!-- Verdict + paywall -->
    <div v-else-if="stage === 'verdict' && classification" class="mt-8 space-y-6">
      <div class="flex items-center justify-between gap-3">
        <span class="eyebrow">Your verdict</span>
        <button type="button" class="text-xs font-spacemono text-slate-400 hover:text-sky-500 transition-colors" @click="restart">
          ↺ Start over
        </button>
      </div>

      <SteamAuditVerdictPanel :classification="classification" />

      <label class="block max-w-md">
        <span class="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">Game name <span class="text-slate-400 font-normal">(optional, used in your disclosure)</span></span>
        <input
          v-model="gameName"
          type="text"
          placeholder="e.g. Tiny Boo: Homecoming"
          class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
        >
      </label>

      <SteamAuditPaywall
        :classification="classification"
        :price-label="priceLabel"
        :loading="checkoutLoading"
        :error="checkoutError"
        @unlock="startCheckout"
      />
    </div>

    <!-- FAQ -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8">
      <span class="eyebrow">FAQ</span>
      <dl class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            What does Steam make me disclose?
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            AI content that ships with your game and is consumed by players — split into Pre-Generated (made during development)
            and Live-Generated (made at runtime). Behind-the-scenes efficiency tools are not the focus.
          </dd>
        </div>
        <div>
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            Is this legal advice?
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            No. It helps you complete and document Steam's disclosure against the current policy. Informational, not legal advice.
          </dd>
        </div>
        <div>
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            Why pay if ChatGPT writes text?
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You pay for a verdict matched to Valve's current ruleset, a dated proof-of-good-faith protocol, and backlash-safe
            wording — not for three paragraphs.
          </dd>
        </div>
        <div>
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            What exactly do I get?
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Paste-ready text for each Steamworks field, a player-facing store disclosure, and a downloadable dated protocol.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
