<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  decodeJwt,
  getAlgInfo,
  getClaimTime,
  getTokenStatus,
  interpretClaims,
} from '~/utils/jwt'

definePageMeta({
  layout: 'default',
})

const route = useRoute()

// Classic demo token (signed with the secret "your-256-bit-secret").
const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
const SAMPLE_SECRET = 'your-256-bit-secret'

function readQueryToken(): string {
  const raw = route.query.token
  if (typeof raw === 'string' && raw.trim())
    return raw
  if (Array.isArray(raw) && raw[0])
    return String(raw[0])
  return SAMPLE_TOKEN
}

useToolPageSchema({
  path: '/tools/jwt-decoder',
  title: 'JWT Decoder & Verifier',
  description: 'Decode and verify JSON Web Tokens online. Inspect the header and payload, read standard claims, check expiry, and verify HMAC, RSA, and ECDSA signatures — entirely in your browser.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Client-side JWT decoder and signature verifier (HS/RS/ES/PS).',
  appIsFree: true,
  faq: [
    {
      question: 'Is my token sent to a server?',
      answer: 'No. Decoding and signature verification run entirely in your browser using the Web Crypto API. Your token, secret, and keys never leave your device.',
    },
    {
      question: 'Which signature algorithms are supported?',
      answer: 'HMAC (HS256/384/512) with a shared secret, and RSA, RSA-PSS, and ECDSA (RS/PS/ES 256/384/512) with a public key in PEM or JWK format.',
    },
    {
      question: 'Does it validate token expiry?',
      answer: 'The decoder shows token status from the exp and nbf claims, but signature verification is reported separately so you can verify the signature of an already-expired token.',
    },
    {
      question: 'Can it verify a token signed with "alg: none"?',
      answer: 'No. "alg: none" carries no signature, so the tool reports it as unverifiable and flags it as insecure.',
    },
  ],
})

const token = ref(readQueryToken())

const decoded = computed(() => decodeJwt(token.value))
const algInfo = computed(() => getAlgInfo(decoded.value.header))
const status = computed(() => getTokenStatus(decoded.value.payload))
const timeClaims = computed(() =>
  (['iat', 'nbf', 'exp'] as const)
    .map(c => getClaimTime(decoded.value.payload, c))
    .filter(c => c !== null),
)
const claims = computed(() => interpretClaims(decoded.value.payload))

const headerJson = computed(() => decoded.value.header ? JSON.stringify(decoded.value.header, null, 2) : '')
const payloadJson = computed(() => decoded.value.payload ? JSON.stringify(decoded.value.payload, null, 2) : '')

function partError(part: 'header' | 'payload'): string | null {
  return decoded.value.errors.find(e => e.part === part)?.message ?? null
}

const compactToken = computed(() => {
  const r = decoded.value.raw
  return `${r.header}.${r.payload}.${r.signature}`
})

const STATUS_META: Record<string, { label: string, icon: string, classes: string }> = {
  'valid': { label: 'Valid', icon: 'mdi:check-circle', classes: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  'expired': { label: 'Expired', icon: 'mdi:close-circle', classes: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10' },
  'not-yet-valid': { label: 'Not yet valid', icon: 'mdi:alert', classes: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10' },
  'no-expiry': { label: 'No expiry', icon: 'mdi:information', classes: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10' },
  'invalid': { label: 'Invalid', icon: 'mdi:close-circle', classes: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10' },
}
const statusMeta = computed(() => STATUS_META[status.value])

const CLAIM_LABEL: Record<string, string> = { iat: 'Issued at', nbf: 'Not before', exp: 'Expiration' }

// --- copy-to-clipboard -----------------------------------------------------
const copied = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyText(value: string, id: string) {
  if (!value || typeof navigator === 'undefined' || !navigator.clipboard)
    return
  navigator.clipboard.writeText(value).then(() => {
    copied.value = id
    if (copyTimer)
      clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = null
    }, 1500)
  }).catch(() => {})
}

// --- signature verification (lazy `jose`, all client-side) -----------------
type VerifyState = 'idle' | 'verifying' | 'verified' | 'invalid' | 'unable'
const showVerify = ref(false)
const secret = ref('')
const keyText = ref('')
const keyFormat = ref<'pem' | 'jwk'>('pem')
const verifyState = ref<VerifyState>('idle')
const verifyError = ref('')

function loadSample() {
  token.value = SAMPLE_TOKEN
  secret.value = SAMPLE_SECRET
  keyText.value = ''
}

function clearToken() {
  token.value = ''
}

const inputMode = computed<'secret' | 'key' | 'none'>(() => {
  const f = algInfo.value.family
  if (f === 'HMAC')
    return 'secret'
  if (f === 'RSA' || f === 'ECDSA' || f === 'RSA-PSS')
    return 'key'
  return 'none'
})

// Reset the verdict whenever the inputs change.
watch([token, secret, keyText, keyFormat], () => {
  verifyState.value = 'idle'
  verifyError.value = ''
})

async function verify() {
  verifyError.value = ''
  const info = algInfo.value
  if (!info.alg || info.family === 'none' || info.family === 'unknown') {
    verifyState.value = 'unable'
    verifyError.value = info.warning || 'This algorithm cannot be verified.'
    return
  }
  if (!decoded.value.raw.signature) {
    verifyState.value = 'unable'
    verifyError.value = 'Token has no signature to verify.'
    return
  }

  verifyState.value = 'verifying'
  try {
    const jose = await import('jose')
    let key: Awaited<ReturnType<typeof jose.importSPKI>> | Uint8Array
    try {
      if (info.family === 'HMAC') {
        if (!secret.value) {
          verifyState.value = 'unable'
          verifyError.value = 'Enter the shared secret used to sign the token.'
          return
        }
        key = new TextEncoder().encode(secret.value)
      }
      else {
        const text = keyText.value.trim()
        if (!text) {
          verifyState.value = 'unable'
          verifyError.value = 'Enter the public key used to verify the token.'
          return
        }
        key = keyFormat.value === 'jwk'
          ? await jose.importJWK(JSON.parse(text), info.alg)
          : await jose.importSPKI(text, info.alg)
      }
    }
    catch (e) {
      verifyState.value = 'unable'
      verifyError.value = `Could not read the key (does it match ${info.alg}?): ${(e as Error).message}`
      return
    }

    try {
      await jose.compactVerify(compactToken.value, key, { algorithms: [info.alg] })
      verifyState.value = 'verified'
    }
    catch (e) {
      verifyState.value = 'invalid'
      verifyError.value = (e as Error).message
    }
  }
  catch (e) {
    verifyState.value = 'unable'
    verifyError.value = `Verification failed to run: ${(e as Error).message}`
  }
}

const VERIFY_META: Record<Exclude<VerifyState, 'idle' | 'verifying'>, { label: string, icon: string, classes: string }> = {
  verified: { label: 'Signature verified', icon: 'mdi:shield-check', classes: 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  invalid: { label: 'Invalid signature', icon: 'mdi:shield-alert', classes: 'text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10' },
  unable: { label: 'Unable to verify', icon: 'mdi:alert', classes: 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10' },
}

function stringify(value: unknown): string {
  if (typeof value === 'string')
    return value
  return JSON.stringify(value)
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <header class="mb-6">
      <h1 class="text-3xl font-bold tracking-tight">
        JWT Decoder &amp; Verifier
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Decode a JSON Web Token, read its claims, and verify its signature.
      </p>
    </header>

    <!-- Privacy banner -->
    <div class="mb-8 flex items-start gap-3 rounded-md border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
      <Icon name="mdi:shield-check" size="20" class="shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
      <p>Everything runs in your browser. Your token, secret, and keys never leave this page.</p>
    </div>

    <!-- Token input -->
    <section class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <label for="jwt-input" class="text-sm font-medium">Encoded token</label>
        <div class="flex items-center gap-3 text-xs">
          <button type="button" class="underline text-slate-600 dark:text-slate-300 hover:cursor-pointer" @click="loadSample">
            Load sample
          </button>
          <button type="button" class="underline text-slate-600 dark:text-slate-300 hover:cursor-pointer" @click="clearToken">
            Clear
          </button>
        </div>
      </div>
      <textarea
        id="jwt-input"
        v-model="token"
        rows="5"
        spellcheck="false"
        placeholder="Paste a JWT here (header.payload.signature)…"
        class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-sm break-all focus:outline-none focus:ring-2 focus:ring-sky-400"
      />

      <!-- Colored token preview -->
      <div v-if="decoded.partCount >= 2" class="mt-3 rounded-md border border-slate-200 dark:border-slate-800 p-3 font-mono text-sm break-all bg-slate-50 dark:bg-slate-900/50">
        <span class="text-rose-500">{{ decoded.raw.header }}</span>
        <span class="text-slate-400">.</span>
        <span class="text-fuchsia-500">{{ decoded.raw.payload }}</span>
        <template v-if="decoded.raw.signature">
          <span class="text-slate-400">.</span>
          <span class="text-sky-500">{{ decoded.raw.signature }}</span>
        </template>
      </div>
    </section>

    <!-- Status + algorithm pills -->
    <div v-if="decoded.ok" class="mb-6 flex flex-wrap items-center gap-2 text-sm">
      <ClientOnly>
        <span class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium" :class="statusMeta.classes">
          <Icon :name="statusMeta.icon" size="16" aria-hidden="true" />
          {{ statusMeta.label }}
        </span>
      </ClientOnly>
      <span v-if="algInfo.alg" class="inline-flex items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 font-medium text-slate-700 dark:text-slate-200">
        <Icon name="mdi:key-variant" size="16" aria-hidden="true" />
        {{ algInfo.alg }}
      </span>
      <span v-if="algInfo.warning" class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-600 dark:text-amber-400">
        <Icon name="mdi:alert" size="16" aria-hidden="true" />
        {{ algInfo.warning }}
      </span>
    </div>

    <!-- Decode errors (when not ok) -->
    <div v-if="!decoded.ok && token.trim()" class="mb-6 rounded-md border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
      <p v-for="err in decoded.errors" :key="err.part">
        <span class="font-medium capitalize">{{ err.part }}:</span> {{ err.message }}
      </p>
    </div>

    <!-- Header + Payload panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="rounded-md border border-slate-200 dark:border-slate-800 p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500">
            <Icon name="mdi:code-json" size="16" aria-hidden="true" />
            Header
          </h2>
          <button
            v-if="headerJson"
            type="button"
            class="inline-flex items-center gap-1 text-xs underline text-slate-600 dark:text-slate-300 hover:cursor-pointer"
            @click="copyText(headerJson, 'header')"
          >
            <Icon :name="copied === 'header' ? 'mdi:check' : 'mdi:content-copy'" size="14" :class="copied === 'header' ? 'text-emerald-500' : ''" />
            {{ copied === 'header' ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre v-if="headerJson" class="font-mono text-xs overflow-auto text-slate-900 dark:text-slate-100">{{ headerJson }}</pre>
        <p v-else-if="partError('header')" class="text-xs text-rose-500">
          {{ partError('header') }}
        </p>
        <p v-else class="text-xs text-slate-400">
          —
        </p>
      </div>

      <div class="rounded-md border border-slate-200 dark:border-slate-800 p-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="inline-flex items-center gap-1.5 text-sm font-semibold text-fuchsia-500">
            <Icon name="mdi:code-json" size="16" aria-hidden="true" />
            Payload
          </h2>
          <button
            v-if="payloadJson"
            type="button"
            class="inline-flex items-center gap-1 text-xs underline text-slate-600 dark:text-slate-300 hover:cursor-pointer"
            @click="copyText(payloadJson, 'payload')"
          >
            <Icon :name="copied === 'payload' ? 'mdi:check' : 'mdi:content-copy'" size="14" :class="copied === 'payload' ? 'text-emerald-500' : ''" />
            {{ copied === 'payload' ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <pre v-if="payloadJson" class="font-mono text-xs overflow-auto text-slate-900 dark:text-slate-100">{{ payloadJson }}</pre>
        <p v-else-if="partError('payload')" class="text-xs text-rose-500">
          {{ partError('payload') }}
        </p>
        <p v-else class="text-xs text-slate-400">
          —
        </p>
      </div>
    </div>

    <!-- Claims interpretation -->
    <ClientOnly>
      <section v-if="decoded.ok && claims.length" class="mt-8 rounded-md border border-slate-200 dark:border-slate-800 p-4">
        <h2 class="text-sm font-semibold mb-3">
          Claims
        </h2>

        <!-- Time claims with friendly absolute + relative time -->
        <dl v-if="timeClaims.length" class="mb-4 space-y-1.5 text-sm">
          <div v-for="t in timeClaims" :key="t.claim" class="flex flex-wrap gap-x-2">
            <dt class="font-medium text-slate-700 dark:text-slate-200">
              {{ CLAIM_LABEL[t.claim] }}
            </dt>
            <dd class="text-slate-600 dark:text-slate-400">
              {{ t.absolute }} ({{ t.relative }})
            </dd>
          </div>
        </dl>

        <!-- All claims with standard-claim descriptions -->
        <dl class="space-y-2 text-sm border-t border-slate-200 dark:border-slate-800 pt-3">
          <div v-for="c in claims" :key="c.key" class="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-0.5">
            <dt class="font-mono text-slate-700 dark:text-slate-200">
              {{ c.key }}
              <span v-if="c.name" class="block text-[11px] font-sans font-normal text-slate-400">{{ c.name }}</span>
            </dt>
            <dd class="min-w-0">
              <span class="font-mono break-all text-slate-900 dark:text-slate-100">{{ stringify(c.value) }}</span>
              <span v-if="c.description" class="block text-[11px] text-slate-400">{{ c.description }}</span>
            </dd>
          </div>
        </dl>
      </section>
    </ClientOnly>

    <!-- Verify signature -->
    <section v-if="decoded.ok" class="mt-8 rounded-md border border-slate-200 dark:border-slate-800 p-4">
      <button
        type="button"
        class="flex w-full items-center justify-between text-sm font-semibold hover:cursor-pointer"
        @click="showVerify = !showVerify"
      >
        <span class="inline-flex items-center gap-1.5">
          <Icon name="mdi:shield-key" size="16" aria-hidden="true" />
          Verify signature
        </span>
        <Icon :name="showVerify ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="18" aria-hidden="true" />
      </button>

      <div v-if="showVerify" class="mt-4 space-y-3 text-sm">
        <template v-if="inputMode === 'secret'">
          <label for="jwt-secret" class="block font-medium">Secret <span class="font-normal text-slate-400">(HMAC, treated as UTF-8 text)</span></label>
          <input
            id="jwt-secret"
            v-model="secret"
            type="text"
            spellcheck="false"
            placeholder="your-256-bit-secret"
            class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
          >
        </template>

        <template v-else-if="inputMode === 'key'">
          <div class="flex items-center gap-3">
            <span class="font-medium">Public key format:</span>
            <label class="inline-flex items-center gap-1 cursor-pointer">
              <input v-model="keyFormat" type="radio" value="pem"> PEM
            </label>
            <label class="inline-flex items-center gap-1 cursor-pointer">
              <input v-model="keyFormat" type="radio" value="jwk"> JWK
            </label>
          </div>
          <textarea
            v-model="keyText"
            rows="6"
            spellcheck="false"
            :placeholder="keyFormat === 'pem' ? '-----BEGIN PUBLIC KEY-----\n…' : '{ &quot;kty&quot;: &quot;RSA&quot;, … }'"
            class="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono text-xs"
          />
        </template>

        <p v-else class="text-slate-500 dark:text-slate-400">
          This token's algorithm (<code class="font-mono">{{ algInfo.alg ?? 'none' }}</code>) cannot be verified.
        </p>

        <div v-if="inputMode !== 'none'" class="flex items-center gap-3">
          <button
            type="button"
            :disabled="verifyState === 'verifying'"
            class="rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
            @click="verify"
          >
            {{ verifyState === 'verifying' ? 'Verifying…' : 'Verify' }}
          </button>
          <span
            v-if="verifyState !== 'idle' && verifyState !== 'verifying'"
            class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium"
            :class="VERIFY_META[verifyState].classes"
          >
            <Icon :name="VERIFY_META[verifyState].icon" size="16" aria-hidden="true" />
            {{ VERIFY_META[verifyState].label }}
          </span>
        </div>

        <p v-if="verifyError" class="text-xs text-slate-500 dark:text-slate-400 break-words">
          {{ verifyError }}
        </p>
      </div>
    </section>

    <!-- About / FAQ -->
    <section class="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 text-sm text-slate-600 dark:text-slate-300">
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
        About this tool
      </h2>
      <p class="mt-2">
        A JSON Web Token (JWT) is made of three base64url-encoded parts separated by dots: a
        <span class="text-rose-500 font-medium">header</span>, a
        <span class="text-fuchsia-500 font-medium">payload</span> of claims, and a
        <span class="text-sky-500 font-medium">signature</span>. This decoder parses the header
        and payload locally and can verify the signature with your secret or public key — nothing
        is uploaded.
      </p>

      <h2 class="mt-8 text-xl font-semibold text-slate-900 dark:text-slate-100">
        FAQ
      </h2>
      <dl class="mt-2 space-y-4">
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Is my token sent to a server?
          </dt>
          <dd class="mt-1">
            No. Decoding and signature verification run entirely in your browser using the Web Crypto API. Your token, secret, and keys never leave your device.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Which signature algorithms are supported?
          </dt>
          <dd class="mt-1">
            HMAC (HS256/384/512) with a shared secret, and RSA, RSA-PSS, and ECDSA (RS/PS/ES 256/384/512) with a public key in PEM or JWK format.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Does it validate token expiry?
          </dt>
          <dd class="mt-1">
            The decoder shows token status from the <code class="font-mono">exp</code> and <code class="font-mono">nbf</code> claims, but signature verification is reported separately so you can verify the signature of an already-expired token.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-slate-900 dark:text-slate-100">
            Can it verify a token signed with "alg: none"?
          </dt>
          <dd class="mt-1">
            No. "alg: none" carries no signature, so the tool reports it as unverifiable and flags it as insecure.
          </dd>
        </div>
      </dl>
    </section>
  </div>
</template>
