<script setup lang="ts">
import type { OfferingId } from '~/data/offerings'
import { ref } from 'vue'
import { isOfferingId, offeringById, OFFERINGS } from '~/data/offerings'
import { INQUIRY_LIMITS, normalizeInquiry } from '~/utils/inquiry'

const props = withDefaults(defineProps<{
  heading: string
  lede: string
  facts?: string[]
  /** Preselected offering. On a single-service page, pair with `lockService`. */
  service?: OfferingId
  /**
   * Replace the <select> with a static line. Right on /services/mentorship where
   * the URL removes all ambiguity; wrong on the shared index, where a visitor may
   * have landed on the wrong card.
   */
  lockService?: boolean
  /** Analytics `location` param. */
  location: string
}>(), {
  service: 'mentorship',
  lockService: false,
})

const TELEGRAM = 'https://t.me/xploitravy'

const selected = ref<OfferingId>(props.service)
const name = ref('')
const contact = ref('')
const message = ref('')
const consent = ref(false)
// Honeypot. Never shown, never focusable — any value means a bot.
const company = ref('')

const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const error = ref('')

const route = useRoute()

// Client-only: both service pages are prerendered, so the query string isn't
// known at build time.
onMounted(() => {
  if (props.lockService)
    return
  const q = route.query.service
  const value = Array.isArray(q) ? q[0] : q
  if (isOfferingId(value))
    selected.value = value
})

const telegramHref = computed(() => {
  const text = offeringById(selected.value)?.telegramText
  return text ? `${TELEGRAM}?text=${encodeURIComponent(text)}` : TELEGRAM
})

const selectedLabel = computed(() => offeringById(selected.value)?.inquiryLabel ?? '')

async function submit() {
  if (status.value === 'loading')
    return

  const payload = {
    service: selected.value,
    name: name.value,
    contact: contact.value,
    message: message.value,
    consent: consent.value,
    company: company.value,
    page: route.path,
  }

  // Same validator the server runs, so the copy can't drift.
  const check = normalizeInquiry(payload)

  // Honeypot: behave exactly as a success, and send nothing.
  if (check.status === 'honeypot') {
    status.value = 'success'
    return
  }

  if (check.status === 'invalid') {
    status.value = 'error'
    error.value = check.message
    return
  }

  status.value = 'loading'
  error.value = ''

  try {
    await $fetch<{ ok: boolean }>('/api/services/inquiry', { method: 'POST', body: payload })
    status.value = 'success'
    useAnalytics().track('service_inquiry', { service: selected.value, location: props.location })
  }
  catch (e: unknown) {
    // The form keeps its content on failure — never make someone retype a lead.
    status.value = 'error'
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Please try again, or write to me on Telegram.'
  }
}

const fieldClasses = 'w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/60 focus:border-accent-400 disabled:opacity-60'
</script>

<template>
  <div class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8">
    <!-- Success replaces the form entirely: no duplicate sends, and no
         "did that actually work?" ambiguity. -->
    <div v-if="status === 'success'" class="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
      <p class="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100">
        <Icon name="mdi:check-circle-outline" class="w-5 h-5 text-emerald-500" aria-hidden="true" />
        Got it. I'll reply within 24 hours.
      </p>
      <p class="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        I read every inquiry myself, so the answer comes from me and not a template. If it's faster for you, message me on Telegram and mention your name — I'll match it to this form.
      </p>
      <p class="mt-4 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Sent · {{ selectedLabel }} · reply in 24 h
      </p>
      <a
        :href="telegramHref"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      >
        <Icon name="fa:telegram" class="w-4 h-4" aria-hidden="true" />
        Message on Telegram
      </a>
    </div>

    <template v-else>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {{ props.heading }}
      </h2>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {{ props.lede }}
      </p>
      <p v-if="props.facts?.length" class="mt-3 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <template v-for="(fact, i) in props.facts" :key="fact">
          <span v-if="i > 0" class="text-accent-500" aria-hidden="true"> · </span>{{ fact }}
        </template>
      </p>

      <form class="mt-6 max-w-xl space-y-4" @submit.prevent="submit">
        <div v-if="!props.lockService">
          <label for="inquiry-service" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            What this is about
          </label>
          <select id="inquiry-service" v-model="selected" :class="fieldClasses" :disabled="status === 'loading'">
            <option v-for="offering in OFFERINGS" :key="offering.id" :value="offering.id">
              {{ offering.inquiryLabel }}
            </option>
          </select>
        </div>
        <p v-else class="font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Inquiry about: <span class="text-accent-600 dark:text-accent-400">{{ selectedLabel }}</span>
        </p>

        <div>
          <label for="inquiry-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Your name
          </label>
          <input
            id="inquiry-name"
            v-model="name"
            type="text"
            autocomplete="name"
            :maxlength="INQUIRY_LIMITS.name"
            placeholder="Anna"
            :disabled="status === 'loading'"
            :class="fieldClasses"
          >
        </div>

        <div>
          <label for="inquiry-contact" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Where should I reply
          </label>
          <input
            id="inquiry-contact"
            v-model="contact"
            type="text"
            autocomplete="off"
            :maxlength="INQUIRY_LIMITS.contact"
            placeholder="@yourhandle, +971…, or you@example.com"
            aria-describedby="inquiry-contact-hint"
            :disabled="status === 'loading'"
            :class="fieldClasses"
          >
          <p id="inquiry-contact-hint" class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Telegram, WhatsApp, or email. Whichever you actually read.
          </p>
        </div>

        <div>
          <label for="inquiry-message" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Where you are right now <span class="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="inquiry-message"
            v-model="message"
            rows="4"
            :maxlength="INQUIRY_LIMITS.message"
            placeholder="What you've tried, what you can show, and how many hours a week you can put in."
            :disabled="status === 'loading'"
            :class="fieldClasses"
          />
        </div>

        <!-- Honeypot: humans never see or tab to this. Any value → the submit is
             silently dropped, here and again server-side. Positioned off-screen
             rather than display:none, which some bots skip. Do not add `required`. -->
        <input
          v-model="company"
          name="company"
          type="text"
          tabindex="-1"
          autocomplete="off"
          aria-hidden="true"
          class="absolute -left-[9999px] w-px h-px opacity-0"
        >

        <label class="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          <input
            v-model="consent"
            type="checkbox"
            class="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-slate-300 dark:border-slate-600 text-accent-600 focus:ring-2 focus:ring-accent-500/60"
            :disabled="status === 'loading'"
          >
          <span>
            I agree that Andrei Rovnyi (XPLOIT FZE) may use the contact details above to reply to this inquiry, as described in the
            <NuxtLink to="/docs/privacy-policy" class="underline decoration-slate-400/50 hover:text-accent-600 dark:hover:text-accent-400">Privacy Policy</NuxtLink>.
          </span>
        </label>

        <p v-if="status === 'error'" class="text-xs text-rose-600 dark:text-rose-400" aria-live="polite">
          {{ error }}
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-1">
          <UiButton variant="accent" type="submit" :disabled="status === 'loading'">
            <Icon v-if="status === 'loading'" name="svg-spinners:180-ring" size="16" aria-hidden="true" />
            <Icon v-else name="mdi:send-outline" size="16" aria-hidden="true" />
            {{ status === 'loading' ? 'Sending…' : 'Send the inquiry' }}
          </UiButton>

          <!-- Promoted to a visible button on failure so a broken endpoint never
               costs the lead. -->
          <a
            v-if="status === 'error'"
            :href="telegramHref"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
          >
            <Icon name="fa:telegram" class="w-4 h-4" aria-hidden="true" />
            Message on Telegram instead
          </a>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          No newsletter, no shared data, and no calls unless you ask for one.
        </p>
      </form>
    </template>
  </div>
</template>
