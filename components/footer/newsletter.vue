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
    useAnalytics().track('newsletter_subscribe', {
      status: res.status === 'already' ? 'existing' : 'new',
      location: 'footer',
    })
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
      <p class="flex items-center gap-2 text-sm font-bold tracking-tight text-fg">
        <span class="inline-block w-1.5 h-3 bg-accent -skew-x-10" />
        {{ footerData.newsletter.title }}
      </p>
      <p class="mt-2 text-sm leading-relaxed text-fg-muted">
        {{ footerData.newsletter.blurb }}
      </p>
    </div>

    <form class="flex flex-col gap-2" @submit.prevent="subscribe">
      <div class="flex flex-col sm:flex-row gap-3">
        <label for="newsletter-email" class="sr-only">Email address</label>
        <!-- Slanted like the button beside it: the plate is the wrapper's
             ::before (.skew-field), the input itself is transparent. -->
        <span class="skew-box skew-field flex-1">
          <input
            id="newsletter-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="status === 'loading'"
            class="w-full bg-transparent border-0 px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-0 disabled:opacity-60"
          >
        </span>
        <button
          type="submit"
          :disabled="status === 'loading'"
          class="skew-box btn btn-primary btn-sm"
        >
          <Icon v-if="status === 'loading'" name="svg-spinners:180-ring" size="16" aria-hidden="true" />
          <Icon v-else name="mdi:email-fast-outline" size="16" aria-hidden="true" />
          Subscribe
        </button>
      </div>
      <p
        v-if="message"
        class="text-xs"
        :class="status === 'error' ? 'text-danger' : 'text-ok'"
        aria-live="polite"
      >
        {{ message }}
      </p>
    </form>
  </div>
</template>
