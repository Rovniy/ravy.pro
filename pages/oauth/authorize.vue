<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

/**
 * OAuth consent screen for the MCP endpoint. claude.ai / Claude Code open this
 * page with the standard authorization-request query; the person signs in with
 * the site's Google login (via <StudioGate>, so only studio grantees get past
 * it) and approves. The server validates the request first and the page only
 * ever redirects to a redirect_uri the server has confirmed.
 */

definePageMeta({ layout: 'default' })

useHead({
  title: 'Connect to Claude',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const { authedFetch } = useAuthedFetch()

function q(name: string): string {
  const value = route.query[name]
  return typeof value === 'string' ? value : ''
}

const request = {
  client_id: q('client_id'),
  redirect_uri: q('redirect_uri'),
  response_type: q('response_type'),
  code_challenge: q('code_challenge'),
  code_challenge_method: q('code_challenge_method'),
  state: q('state'),
  scope: q('scope'),
  resource: q('resource'),
}

interface ClientCheck {
  ok: boolean
  error?: string
  redirectable?: boolean
  clientName?: string
  redirectHost?: string
  issuer?: string
}

const check = ref<ClientCheck | null>(null)
const busy = ref(false)
const errorMsg = ref('')
const done = ref(false)

const fatal = computed(() => check.value && !check.value.ok && !check.value.redirectable)
const returnable = computed(() => check.value && !check.value.ok && check.value.redirectable)

// Client registration is open, so a redirect_uri is only as trustworthy as
// whoever registered it. Bouncing an error back automatically would turn this
// page into an open redirector under the site's domain for any https URL an
// attacker registered. Only a loopback address — a CLI on the user's own
// machine — is safe to return to without a click (RFC 9700 §4.11.2).
function isLoopback(uri: string): boolean {
  try {
    return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(uri).hostname)
  }
  catch {
    return false
  }
}

function returnWithError() {
  redirectWith({ error: check.value?.error ?? 'invalid_request', state: request.state })
}

function redirectWith(params: Record<string, string>) {
  const url = new URL(request.redirect_uri)
  for (const [k, v] of Object.entries(params)) {
    if (v)
      url.searchParams.set(k, v)
  }
  done.value = true
  window.location.assign(url.toString())
}

onMounted(async () => {
  try {
    const query = new URLSearchParams(Object.entries(request).filter(([, v]) => v)).toString()
    check.value = await $fetch<ClientCheck>(`/api/oauth/client?${query}`)
    // A malformed but correctly addressed request goes back to the client with
    // the error, as the spec requires — automatically only for loopback, behind
    // a click everywhere else (see isLoopback).
    if (returnable.value && isLoopback(request.redirect_uri))
      returnWithError()
  }
  catch {
    check.value = { ok: false, error: 'Could not validate the request. Try connecting again.' }
  }
})

async function allow() {
  busy.value = true
  errorMsg.value = ''
  try {
    const res = await authedFetch<{ redirect: string }>('/api/oauth/authorize', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    done.value = true
    window.location.assign(res.redirect)
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Authorization failed'
    busy.value = false
  }
}

function deny() {
  redirectWith({ error: 'access_denied', state: request.state, iss: check.value?.issuer ?? '' })
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-xl">
    <h1 class="text-4xl font-display font-extrabold uppercase mb-6 leading-none">
      Connect to Claude
    </h1>

    <div v-if="!check" class="text-fg-muted">
      Checking the request…
    </div>

    <div v-else-if="fatal" class="border border-danger/40 bg-danger/10 p-6 text-sm text-danger">
      {{ check.error }}
    </div>

    <div v-else-if="returnable && !done" class="border border-danger/40 bg-danger/10 p-6 text-sm text-danger">
      <p class="mb-4">
        The app sent a malformed connection request (<span class="font-mono">{{ check.error }}</span>), so nothing was authorized.
      </p>
      <button
        type="button"
        class="border border-danger/40 px-4 py-2 font-medium hover:cursor-pointer"
        @click="returnWithError"
      >
        Return to {{ check.redirectHost }}
      </button>
    </div>

    <StudioGate v-else-if="check.ok">
      <div class="border border-line p-6 bg-panel-raised">
        <p class="text-base mb-4">
          <strong>{{ check.clientName }}</strong> wants to manage the blog on this site as you.
        </p>
        <ul class="text-sm text-fg-muted list-disc pl-5 space-y-1 mb-4">
          <li>read every post, including drafts;</li>
          <li>create and edit posts and upload images;</li>
          <li>publish and unpublish posts — they go live within a minute.</li>
        </ul>
        <p class="text-xs text-fg-muted mb-6">
          You will be returned to <span class="font-mono">{{ check.redirectHost }}</span>.
          Only allow this if you just started connecting from there. You can disconnect it any time in Studio.
        </p>

        <div class="flex gap-3">
          <button
            type="button"
            class="skew-box btn btn-primary btn-sm"
            :disabled="busy || done"
            @click="allow"
          >
            {{ busy || done ? 'Connecting…' : 'Allow' }}
          </button>
          <button
            type="button"
            class="skew-box btn btn-secondary btn-sm"
            :disabled="busy || done"
            @click="deny"
          >
            Deny
          </button>
        </div>
        <p v-if="errorMsg" class="mt-3 text-sm text-danger">
          {{ errorMsg }}
        </p>
      </div>
    </StudioGate>

    <div v-else class="text-fg-muted">
      Returning to the app…
    </div>
  </div>
</template>
