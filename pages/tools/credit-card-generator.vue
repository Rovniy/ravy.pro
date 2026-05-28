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

useToolPageSchema({
  path: '/tools/credit-card-generator',
  title: 'Free Credit Card Number Generator & Validator',
  description: 'Generate Luhn-valid test credit card numbers for QA and sandbox payments, or validate a card number to detect its brand and check format. Test data only.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Online credit card number generator and Luhn validator for QA and sandbox testing.',
  appIsFree: true,
  faq: [
    {
      question: 'Are these real credit card numbers?',
      answer: 'No. The generated numbers pass the Luhn check used by payment forms, but they are not issued by any bank and cannot be used for real purchases.',
    },
    {
      question: 'What card brands are supported?',
      answer: 'Visa, MasterCard, American Express, Discover, JCB, Diners Club, and UnionPay.',
    },
    {
      question: 'Can I use a custom BIN prefix?',
      answer: 'Yes. Enter the BIN (the first digits of the card) and the tool will fill in the rest and compute a valid Luhn check digit.',
    },
    {
      question: 'How does the validator work?',
      answer: 'It strips spaces and dashes, detects the card brand from the prefix, checks the length against the brand specification, and verifies the Luhn checksum.',
    },
  ],
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

function generate() {
  const count = Math.min(Math.max(Math.floor(quantity.value || 1), 1), 50)
  const next: GeneratedCard[] = []
  for (let i = 0; i < count; i++) {
    next.push(generateCard({
      brand: brand.value,
      prefix: prefix.value.trim() || undefined,
    }))
  }
  cards.value = next
}

const copied = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyNumber(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard)
    return
  navigator.clipboard.writeText(value).then(() => {
    copied.value = value
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
    return 'border-zinc-300 dark:border-zinc-700'
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
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
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
        <form class="space-y-4 text-sm" @submit.prevent="generate">
          <div>
            <label class="block mb-1 font-medium" for="cc-brand">Card brand</label>
            <select
              id="cc-brand"
              v-model="brand"
              class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
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
                class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
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
                class="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              >
            </div>
          </div>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 -mt-2">
            {{ prefixHint }}
          </p>

          <div class="flex items-center gap-3">
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
            >
              <Icon name="mdi:credit-card-plus-outline" size="16" />
              Generate
            </button>
            <button
              type="button"
              :disabled="!cards.length"
              class="inline-flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 hover:cursor-pointer"
              @click="copyAll"
            >
              <Icon name="mdi:content-copy" size="16" />
              Copy all
            </button>
          </div>
        </form>

        <div v-if="cards.length" class="mt-6 rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table class="w-full text-xs sm:text-sm">
            <thead class="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 text-left">
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
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr v-for="card in cards" :key="card.number" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
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
              class="w-full rounded-md border bg-white dark:bg-zinc-900 px-3 py-2 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-zinc-400" :class="[
                validatorStateClass,
              ]"
            >
            <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Do not enter a real card number.
            </p>
          </div>

          <div v-if="validation" class="rounded-md border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
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
              <dt class="text-zinc-500 dark:text-zinc-400">
                Formatted
              </dt>
              <dd class="font-mono">
                {{ validation.formatted || '—' }}
              </dd>
              <dt class="text-zinc-500 dark:text-zinc-400">
                Length
              </dt>
              <dd>
                {{ validation.digits.length }} digit{{ validation.digits.length === 1 ? '' : 's' }}
                <span v-if="validation.brand && !validation.lengthValid" class="text-rose-600 dark:text-rose-400">
                  (does not match {{ validation.brandLabel }})
                </span>
              </dd>
              <dt class="text-zinc-500 dark:text-zinc-400">
                Luhn checksum
              </dt>
              <dd :class="validation.luhnValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'">
                {{ validation.luhnValid ? 'pass' : 'fail' }}
              </dd>
              <template v-if="validation.cvvLength">
                <dt class="text-zinc-500 dark:text-zinc-400">
                  Expected CVV
                </dt>
                <dd>
                  {{ validation.cvvLength }} digits
                </dd>
              </template>
            </dl>
          </div>

          <div v-else class="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-zinc-500 dark:text-zinc-400 text-xs">
            Paste a card number above to see brand, length, and Luhn result.
          </div>
        </div>
      </section>
    </div>

    <section class="mt-12 border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        About this tool
      </h2>
      <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        This generator creates credit card numbers that satisfy the
        <a href="https://en.wikipedia.org/wiki/Luhn_algorithm" class="underline hover:text-sky-600">Luhn checksum</a>
        and follow brand-specific prefix and length rules for Visa, MasterCard, American Express, Discover, JCB, Diners Club, and UnionPay. The numbers are useful for filling out test payment forms, exercising QA flows, and seeding sandbox payment gateways. They are <strong>not real</strong> and cannot be used for any purchase or subscription.
      </p>
      <p class="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        The validator does the reverse: strip spaces and dashes from the input, detect the brand by prefix, check that the length matches what the brand allows, and verify the Luhn checksum. Use it to sanity-check the test data your QA stack is producing.
      </p>

      <h2 class="mt-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        FAQ
      </h2>
      <dl class="mt-3 space-y-4 text-sm">
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Are these real credit card numbers?
          </dt>
          <dd class="mt-1 text-zinc-600 dark:text-zinc-400">
            No. They pass the Luhn check used by payment forms, but they are not issued by any bank and have no funds behind them.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Which card brands are supported?
          </dt>
          <dd class="mt-1 text-zinc-600 dark:text-zinc-400">
            Visa, MasterCard, American Express, Discover, JCB, Diners Club, and UnionPay.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Can I generate a card for a specific BIN range?
          </dt>
          <dd class="mt-1 text-zinc-600 dark:text-zinc-400">
            Yes. Enter the BIN prefix and the tool fills in the rest, then appends a valid Luhn check digit.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-zinc-900 dark:text-zinc-100">
            Is the data sent anywhere?
          </dt>
          <dd class="mt-1 text-zinc-600 dark:text-zinc-400">
            No. Everything runs in your browser. Nothing you type or generate leaves your device.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
