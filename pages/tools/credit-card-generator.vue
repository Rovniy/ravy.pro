<script setup lang="ts">
import type { CardBrand, GeneratedCard, ValidationResult } from '~/utils/credit-card'
import { computed, ref, watch } from 'vue'
import {
  BRAND_SPECS,
  generateCard,
  getBrandSpec,
  validateCardNumber,
} from '~/utils/credit-card'

definePageMeta({
  layout: 'default',
})

const faqItems = [
  {
    question: 'Are these real credit card numbers?',
    answer: 'No. The generated numbers pass the Luhn check used by payment forms, but they are fake test data — not issued by any bank, not linked to any account, and they cannot be charged or used for real purchases.',
  },
  {
    question: 'Is it legal to use this generator?',
    answer: 'Yes, for testing your own software, forms, and QA flows. The output is fake test data, not a real card. Using any card number — real or generated — to attempt a real or fraudulent transaction is illegal, so keep these strictly inside your own test environment.',
  },
  {
    question: 'Will these numbers work for real purchases?',
    answer: 'No. They are not backed by funds and are not connected to any issuer, so a real payment processor will decline them. They only satisfy format and checksum rules so your test forms accept them.',
  },
  {
    question: 'What is the Luhn check?',
    answer: 'The Luhn algorithm is a checksum formula that most payment forms run to catch typos before submitting a card. A Luhn-valid number has a correct final check digit; the tool computes this digit so generated numbers pass the same client-side validation real cards do.',
  },
  {
    question: 'Which card brands are supported?',
    answer: 'Visa, Mastercard, American Express, Discover, JCB, Diners Club, and UnionPay, each using that brand\'s real prefix and length rules.',
  },
  {
    question: 'Can I set a custom BIN or prefix?',
    answer: 'Yes. Enter the BIN (the leading digits of the card) and the tool fills in the remaining digits and appends a valid Luhn check digit, so you can target a specific test range.',
  },
  {
    question: 'Does the tool store or send anything?',
    answer: 'No. Generation and validation run entirely in your browser. Nothing you type or generate is stored or sent to any server.',
  },
]

useToolPageSchema({
  path: '/tools/credit-card-generator',
  title: 'Free Credit Card Number Generator & Validator',
  description: 'Generate Luhn-valid test credit card numbers for QA and sandbox payments, or validate a card number to detect its brand and check format. Test data only.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Online credit card number generator and Luhn validator for QA and sandbox testing.',
  appIsFree: true,
  datePublished: '2026-05-20',
  dateModified: '2026-06-26',
  howTo: {
    name: 'How to generate a test card number',
    description: 'Create a Luhn-valid test credit card number for QA, or paste a number to validate it and detect its brand — entirely in your browser.',
    steps: [
      { name: 'Choose a card brand or BIN', text: 'Pick a card brand (Visa, Mastercard, Amex, Discover, JCB, Diners Club, or UnionPay), or enter a custom BIN prefix to target a specific test range.' },
      { name: 'Generate a Luhn-valid test number', text: 'Generate one or more fake test numbers with a valid Luhn check digit, brand-correct length, and matching expiry and CVV.' },
      { name: 'Copy it into your test environment', text: 'Copy a number into your QA forms or sandbox payment gateway. These are test-only numbers and cannot be charged.' },
      { name: 'Or validate an existing number', text: 'Paste a number into the validator to detect its brand, check the length, and verify the Luhn checksum.' },
    ],
  },
  faq: faqItems,
})

const brand = ref<CardBrand>('visa')
const quantity = ref(5)
const prefix = ref('')
const cards = ref<GeneratedCard[]>([])

const validatorInput = ref('')
const validation = ref<ValidationResult | null>(null)

const currentSpec = computed(() => getBrandSpec(brand.value))

const prefixHint = computed(() => {
  const spec = currentSpec.value
  return `Optional. Defaults to a random ${spec.label} prefix (${spec.prefixes.slice(0, 3).join(', ')}…).`
})

const { trackTool } = useAnalytics()

// `emit` is false for the initial seed render (line below the validator watch);
// true only for user-triggered generation so we don't log a synthetic action.
function generate(emit = false) {
  const count = Math.min(Math.max(Math.floor(quantity.value || 1), 1), 50)
  const next: GeneratedCard[] = []
  for (let i = 0; i < count; i++) {
    next.push(generateCard({
      brand: brand.value,
      prefix: prefix.value.trim() || undefined,
    }))
  }
  cards.value = next
  if (emit)
    trackTool('credit-card', 'generate', { brand: brand.value, count })
}

const copied = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyNumber(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard)
    return
  navigator.clipboard.writeText(value).then(() => {
    copied.value = value
    trackTool('credit-card', 'copy')
    if (copyTimer)
      clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = null
    }, 1200)
  }).catch(() => {})
}

function copyAll() {
  if (!cards.value.length)
    return
  const text = cards.value
    .map(c => `${c.formatted}\t${c.expiry}\t${c.cvv}\t${c.holder}`)
    .join('\n')
  if (typeof navigator !== 'undefined' && navigator.clipboard)
    navigator.clipboard.writeText(text).catch(() => {})
  trackTool('credit-card', 'copy_all', { count: cards.value.length })
}

watch(validatorInput, (value) => {
  if (!value.trim()) {
    validation.value = null
    return
  }
  validation.value = validateCardNumber(value)
})

const validatorStateClass = computed(() => {
  const v = validation.value
  if (!v)
    return 'border-slate-300 dark:border-slate-700'
  if (v.luhnValid && v.lengthValid)
    return 'border-emerald-500 dark:border-emerald-400'
  return 'border-rose-500 dark:border-rose-400'
})

// Seed one set so the page has content on first render.
generate()
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <header class="mb-6">
      <h1 class="text-3xl font-bold tracking-tight">
        Credit Card Number Generator & Validator
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Generate Luhn-valid test card numbers for QA and sandbox payments, or validate a card number to detect its brand.
      </p>
    </header>

    <div class="mb-8 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-4 py-3 text-sm flex gap-3 items-start">
      <Icon name="mdi:alert-circle-outline" size="18" class="shrink-0 mt-0.5" />
      <div>
        <strong class="font-semibold">For testing only.</strong>
        These numbers are not real and cannot be used for purchases. Never enter your real card number anywhere on the public internet.
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Generator -->
      <section>
        <h2 class="text-xl font-semibold mb-3">
          Generator
        </h2>
        <form class="space-y-4 text-sm" @submit.prevent="generate(true)">
          <div>
            <label class="block mb-1 font-medium" for="cc-brand">Card brand</label>
            <select
              id="cc-brand"
              v-model="brand"
              class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              <option v-for="spec in BRAND_SPECS" :key="spec.brand" :value="spec.brand">
                {{ spec.label }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block mb-1 font-medium" for="cc-qty">Quantity</label>
              <input
                id="cc-qty"
                v-model.number="quantity"
                type="number"
                min="1"
                max="50"
                class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
            </div>
            <div>
              <label class="block mb-1 font-medium" for="cc-prefix">BIN prefix</label>
              <input
                id="cc-prefix"
                v-model="prefix"
                type="text"
                inputmode="numeric"
                placeholder="e.g. 424242"
                class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
              >
            </div>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            {{ prefixHint }}
          </p>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
            >
              <Icon name="mdi:credit-card-plus-outline" size="16" />
              Generate
            </button>
            <button
              type="button"
              :disabled="!cards.length"
              class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
              @click="copyAll"
            >
              <Icon name="mdi:content-copy" size="16" />
              Copy all
            </button>
          </div>
        </form>

        <div v-if="cards.length" class="mt-6 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table class="w-full text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-left">
              <tr>
                <th class="px-3 py-2 font-medium">
                  Number
                </th>
                <th class="px-3 py-2 font-medium">
                  Exp
                </th>
                <th class="px-3 py-2 font-medium">
                  CVV
                </th>
                <th class="px-3 py-2 font-medium">
                  Holder
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
              <tr v-for="card in cards" :key="card.number" class="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                <td class="px-3 py-2 font-mono">
                  <button
                    type="button"
                    class="hover:underline hover:cursor-pointer text-left"
                    :title="copied === card.number ? 'Copied' : 'Click to copy'"
                    @click="copyNumber(card.number)"
                  >
                    {{ card.formatted }}
                    <Icon
                      v-if="copied === card.number"
                      name="mdi:check"
                      size="14"
                      class="text-emerald-500 inline-block ml-1 align-text-bottom"
                    />
                  </button>
                </td>
                <td class="px-3 py-2 font-mono">
                  {{ card.expiry }}
                </td>
                <td class="px-3 py-2 font-mono">
                  {{ card.cvv }}
                </td>
                <td class="px-3 py-2 font-mono whitespace-nowrap">
                  {{ card.holder }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Validator -->
      <section>
        <h2 class="text-xl font-semibold mb-3">
          Validator
        </h2>
        <div class="space-y-4 text-sm">
          <div>
            <label class="block mb-1 font-medium" for="cc-validate">Card number</label>
            <input
              id="cc-validate"
              v-model="validatorInput"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="4111 1111 1111 1111"
              class="w-full rounded-md border bg-white dark:bg-slate-900 px-3 py-2 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-sky-500/60" :class="[
                validatorStateClass,
              ]"
            >
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Do not enter a real card number.
            </p>
          </div>

          <div v-if="validation" class="rounded-md border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div class="flex items-center gap-2">
              <Icon
                v-if="validation.luhnValid && validation.lengthValid"
                name="mdi:check-circle"
                size="20"
                class="text-emerald-500"
              />
              <Icon
                v-else
                name="mdi:close-circle"
                size="20"
                class="text-rose-500"
              />
              <span class="font-medium">
                {{ validation.luhnValid && validation.lengthValid ? 'Looks valid' : 'Invalid' }}
              </span>
              <span v-if="validation.brandLabel" class="ml-auto inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 px-2 py-0.5 text-xs font-medium">
                <Icon name="mdi:credit-card-outline" size="14" />
                {{ validation.brandLabel }}
              </span>
            </div>

            <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs sm:text-sm">
              <dt class="text-slate-500 dark:text-slate-400">
                Formatted
              </dt>
              <dd class="font-mono">
                {{ validation.formatted || '—' }}
              </dd>
              <dt class="text-slate-500 dark:text-slate-400">
                Length
              </dt>
              <dd>
                {{ validation.digits.length }} digit{{ validation.digits.length === 1 ? '' : 's' }}
                <span v-if="validation.brand && !validation.lengthValid" class="text-rose-600 dark:text-rose-400">
                  (does not match {{ validation.brandLabel }})
                </span>
              </dd>
              <dt class="text-slate-500 dark:text-slate-400">
                Luhn checksum
              </dt>
              <dd :class="validation.luhnValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ validation.luhnValid ? 'pass' : 'fail' }}
              </dd>
              <template v-if="validation.cvvLength">
                <dt class="text-slate-500 dark:text-slate-400">
                  Expected CVV
                </dt>
                <dd>
                  {{ validation.cvvLength }} digits
                </dd>
              </template>
            </dl>
          </div>

          <div v-else class="rounded-md border border-dashed border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400 text-xs">
            Paste a card number above to see brand, length, and Luhn result.
          </div>
        </div>
      </section>
    </div>

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Test credit card numbers, explained
      </h2>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Are generated credit card numbers real?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        No. This tool produces <strong>fake test card numbers</strong> for QA, development, and form
        testing. They are <em>Luhn-valid</em> — they pass the same client-side checksum a payment form
        runs — but they are not issued by any bank, not linked to any account, and have no funds behind
        them. A real payment processor will decline them, so they <strong>cannot be used for
          purchases</strong>.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What is the Luhn check?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        The
        <a href="https://en.wikipedia.org/wiki/Luhn_algorithm" class="underline hover:text-sky-600">Luhn algorithm</a>
        is a simple checksum that most payment forms use to catch typos before a card is submitted. A
        valid number ends in a correct check digit derived from the others. This tool computes that
        digit for every generated number and follows each brand's real prefix and length rules, so your
        test forms accept the data exactly as they would a real card.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Is it legal to use a credit card generator?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Yes, when you use the output to test your own software, forms, and QA flows. These numbers are
        fake test data, not real cards. What is illegal is using any card number — real or generated —
        to attempt a real or fraudulent transaction. Keep generated numbers strictly inside your own
        test environment and never enter a real card number into a tool on the public internet.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What this tool produces
      </h3>
      <ul class="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed list-disc pl-5">
        <li>Luhn-valid <strong>test card numbers</strong> for Visa, Mastercard, American Express, Discover, JCB, Diners Club, and UnionPay</li>
        <li>Optional <strong>custom BIN prefixes</strong> to target a specific test range</li>
        <li>A <strong>validator</strong> that detects brand, checks length, and verifies the Luhn checksum of a pasted number</li>
        <li>Fully <strong>client-side</strong> operation — nothing you type or generate is stored or sent anywhere</li>
      </ul>

      <p class="mt-6 text-sm text-slate-400">
        For software testing only. Generated numbers are fake test data and cannot be used for real transactions.
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
