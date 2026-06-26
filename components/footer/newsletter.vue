<script setup lang="ts">
import { ref } from 'vue'
import { footerData } from '~/data'

const email = ref('')
const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const message = ref('')

async function subscribe() {
  if (status.value === 'loading')
    return
  status.value = 'loading'
  message.value = ''
  try {
    const res = await $fetch<{ ok: boolean, status: 'subscribed' | 'already' }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: email.value },
    })
    status.value = 'success'
    message.value = res.status === 'already'
      ? 'You\'re already on the list — thanks!'
      : 'You\'re in! Thanks for subscribing.'
    email.value = ''
  }
  catch (e: unknown) {
    status.value = 'error'
    const err = e as { data?: { statusMessage?: string }, statusMessage?: string }
    message.value = err?.data?.statusMessage || err?.statusMessage || 'Something went wrong. Please try again.'
  }
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 sm:items-center">
    <div>
      <p class="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
        {{ footerData.newsletter.title }}
      </p>
      <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        {{ footerData.newsletter.blurb }}
      </p>
    </div>

    <form class="flex flex-col gap-2" @submit.prevent="subscribe">
      <div class="flex flex-col sm:flex-row gap-2">
        <label for="newsletter-email" class="sr-only">Email address</label>
        <input
          id="newsletter-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          :disabled="status === 'loading'"
          class="flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 disabled:opacity-60"
        >
        <button
          type="submit"
          :disabled="status === 'loading'"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold px-5 py-2.5 ring-1 ring-sky-400/30 shadow-sm hover:shadow-md disabled:opacity-60 hover:cursor-pointer transition-all"
        >
          <Icon v-if="status === 'loading'" name="svg-spinners:180-ring" size="16" aria-hidden="true" />
          <Icon v-else name="mdi:email-fast-outline" size="16" aria-hidden="true" />
          Subscribe
        </button>
      </div>
      <p
        v-if="message"
        class="text-xs"
        :class="status === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
        aria-live="polite"
      >
        {{ message }}
      </p>
    </form>
  </div>
</template>
