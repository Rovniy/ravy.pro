<script setup lang="ts">
import type { SteamAuditAnswers, SteamAuditClassification } from '~/types/steam-audit'
import { computed, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { EVENTS } from '~/data/analytics'
import { classifyAudit, RULESET_VERSION } from '~/utils/steam-ai-ruleset'

definePageMeta({ layout: 'default' })

const config = useRuntimeConfig()
const { getIdToken } = useAuth()

const PUBLISHED = '2026-06-23'
const UPDATED = '2026-06-26'

const priceUsd = computed(() => {
  const raw = (config.public as Record<string, any>)?.steamAudit?.priceUsd
  return (typeof raw === 'string' && raw.trim()) ? raw.trim() : '39'
})
const priceLabel = computed(() => `$${priceUsd.value}`)

const steps = [
  { icon: 'mdi:format-list-checks', title: 'Answer 10 quick questions', text: 'Plain language, per asset type — art, audio, writing, code, runtime AI. No uploads, no account.' },
  { icon: 'mdi:scale-balance', title: 'Get your verdict — free', text: 'See exactly what must be disclosed as Pre-Generated or Live-Generated, what is exempt, and the gray areas.' },
  { icon: 'mdi:file-document-check', title: 'Unlock the paste-ready pack', text: 'Ready-to-paste Steamworks texts, a player-facing store disclosure, and a dated compliance protocol.' },
]

const faqItems = computed(() => [
  { question: 'What does Steam require me to disclose?', answer: 'In the Steamworks Content Survey, Valve asks you to declare AI-generated content that ships with your game and is consumed by players. It is split into Pre-Generated (created during development) and Live-Generated (created at runtime). Behind-the-scenes efficiency tools are not the focus.' },
  { question: 'What is the difference between Pre-Generated and Live-Generated AI content?', answer: 'Pre-Generated is AI-assisted content made during development that ships in the build — art, audio, writing, or models. Live-Generated is content an AI produces while the game runs, such as an LLM-driven NPC; for it, Valve also requires you to describe the guardrails that prevent illegal content.' },
  { question: 'Do I need to disclose AI-assisted code?', answer: 'Generally no. AI coding assistants are development-efficiency tools, and code that ships but is not player-facing content is outside the disclosure. The exception is a game that generates content via AI at runtime — that is Live-Generated and must be disclosed.' },
  { question: 'Does AI used in marketing capsules or screenshots need disclosure?', answer: 'Store capsule art, screenshots, and trailers are player-facing, so AI used there is in scope and draws extra community scrutiny. Make sure you hold the rights to any AI-generated marketing assets.' },
  { question: 'Can a wrong AI disclosure get my game delisted?', answer: 'Yes. Valve reviews disclosures and can delay review, reject, or remove a store page when the AI disclosure is missing or incorrect. This tool helps you fill it in correctly and keep a dated record of your good-faith review.' },
  { question: 'Is this legal advice?', answer: 'No. The tool helps you complete and document Steam\'s AI disclosure against the current policy. It is informational, not legal advice.' },
  { question: 'Why pay if ChatGPT can write the text?', answer: 'You pay for a verdict matched to Valve\'s current ruleset, a dated proof-of-good-faith protocol you can keep, and wording tuned to avoid community backlash — not for three paragraphs of generic text.' },
  { question: 'How much does it cost and what do I get?', answer: `The verdict is free. For ${priceLabel.value} one-time per game you unlock paste-ready text for each Steamworks field, a player-facing store disclosure, and a downloadable dated compliance protocol.` },
])

useToolPageSchema({
  path: '/tools/steam-ai-disclosure',
  title: 'Steam AI Content Disclosure Generator & Audit',
  description: 'Generate a correct, paste-ready Steam AI content disclosure for the Steamworks Content Survey — Pre-Generated, Live-Generated, and store-page text — plus a dated compliance protocol. Free verdict; matches current Valve policy.',
  appName: 'Steam AI Disclosure Generator',
  appCategory: 'DeveloperApplication',
  appDescription: 'Generates a correct Steamworks AI content disclosure and a dated compliance protocol for game developers.',
  offer: { price: priceUsd.value, currency: 'usd' },
  datePublished: PUBLISHED,
  dateModified: UPDATED,
  howTo: {
    name: 'How to complete your Steam AI content disclosure',
    description: 'Answer a short questionnaire, get a free verdict, then unlock paste-ready Steamworks disclosure text and a dated protocol.',
    steps: steps.map(s => ({ name: s.title, text: s.text })),
  },
  faq: faqItems.value,
})

type Stage = 'intro' | 'wizard' | 'verdict'
const stage = ref<Stage>('intro')
const answers = ref<SteamAuditAnswers>({})
const classification = ref<SteamAuditClassification | null>(null)
const gameName = ref('')

const checkoutLoading = ref(false)
const checkoutError = ref('')

const { track } = useAnalytics()
const TOOL_ID = 'steam-ai-disclosure'

function startWizard() {
  checkoutError.value = ''
  stage.value = 'wizard'
  track(EVENTS.SCAN_START, { tool_id: TOOL_ID })
}

function onComplete(result: SteamAuditAnswers) {
  answers.value = result
  classification.value = classifyAudit(result)
  stage.value = 'verdict'
  track(EVENTS.SCAN_SUBMIT, { tool_id: TOOL_ID })
  track(EVENTS.SCAN_RESULT, { tool_id: TOOL_ID })
  track(EVENTS.PAYWALL_VIEW, { tool_id: TOOL_ID, value: Number(priceUsd.value), currency: 'USD' })
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
  track(EVENTS.BEGIN_CHECKOUT, { tool_id: TOOL_ID, value: Number(priceUsd.value), currency: 'USD' })
  try {
    // Attach the Firebase token when signed in so the audit is linked to the
    // account (shows up in /account history). Anonymous checkout still works.
    const token = await getIdToken().catch(() => null)
    const res = await $fetch<{ url: string }>('/api/steam-audit/checkout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Steam's AI content disclosure, explained
      </h2>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What is the Steam AI content disclosure?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Before a game goes live on Steam, Valve requires developers to complete the
        <strong>Steamworks Content Survey</strong>, which includes a dedicated
        <strong>Generative AI Content</strong> section. A January 2026 update clarified that the
        disclosure targets AI-generated content that <em>ships with your game and is consumed by
          players</em> — not behind-the-scenes efficiency tools used during development.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Pre-Generated vs Live-Generated AI content
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        <strong>Pre-Generated</strong> is AI-assisted content created during development that ships in
        the build — art, textures, models, animation, music, sound, voice, or writing.
        <strong>Live-Generated</strong> is content an AI produces at runtime, while the game is
        running, such as an LLM-driven NPC. For Live-Generated content, Valve also asks you to describe
        the guardrails that prevent the AI from generating illegal content.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Do you need to disclose AI in your Steam game?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        You must disclose when AI-generated content ships and is seen, heard, or read by players. You
        generally do not need to disclose AI used purely as a development or efficiency tool — for
        example, an AI coding assistant whose output is not player-facing content — or placeholder
        assets that a human replaced before release. When you are unsure whether something reaches
        players, Valve's guidance is to disclose.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What this tool produces
      </h3>
      <ul class="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-5">
        <li>Paste-ready text for the Steamworks <strong>Pre-Generated AI Content</strong> field</li>
        <li>Paste-ready <strong>Live-Generated</strong> text plus a guardrails statement, when runtime AI applies</li>
        <li>A calm, player-facing <strong>store-page disclosure</strong> worded to reduce community backlash</li>
        <li>A downloadable, dated <strong>compliance protocol</strong> documenting your review against Valve policy v{{ RULESET_VERSION }}</li>
      </ul>

      <p class="mt-6 text-sm text-slate-400">
        Informational, not legal advice. Reflects Valve's Steamworks AI content policy as of v{{ RULESET_VERSION }}.
      </p>
    </section>

    <!-- FAQ -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8">
      <span class="eyebrow">FAQ</span>
      <dl class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div v-for="item in faqItems" :key="item.question">
          <dt class="font-semibold text-slate-900 dark:text-slate-100">
            {{ item.question }}
          </dt>
          <dd class="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ item.answer }}
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
