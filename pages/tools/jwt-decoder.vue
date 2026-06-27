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

const faqItems = [
  {
    question: 'Is it safe to paste my token here?',
    answer: 'Yes. Decoding and signature verification run entirely in your browser using the Web Crypto API. Your token, secret, and keys are never uploaded or stored, so it is safe to inspect sensitive or production tokens.',
  },
  {
    question: 'What is the difference between decoding and verifying a JWT?',
    answer: 'Decoding reads the base64url-encoded header and payload so you can see the claims — it does not prove the token is genuine. Verifying checks the signature against a secret or public key, which confirms the token was issued by a trusted party and has not been tampered with.',
  },
  {
    question: 'Which signature algorithms are supported?',
    answer: 'HMAC (HS256/HS384/HS512) with a shared secret, and RSA (RS256/384/512), RSA-PSS (PS256/384/512), and ECDSA (ES256/384/512) with a public key in PEM or JWK format.',
  },
  {
    question: 'Can it verify the signature of an expired token?',
    answer: 'Yes. Signature verification uses compactVerify, which checks the signature independently of the exp claim, so an expired-but-otherwise-valid token still verifies. Expiry is reported separately as token status.',
  },
  {
    question: 'Do I need a secret or a public key?',
    answer: 'It depends on the algorithm. HMAC tokens (HS256/384/512) are verified with the shared secret used to sign them. RSA, RSA-PSS, and ECDSA tokens (RS*/PS*/ES*) are verified with the matching public key in PEM or JWK format.',
  },
  {
    question: 'Does it store my token or keys?',
    answer: 'No. Nothing is uploaded to a server or saved. Everything stays in the current browser tab and is discarded when you close it.',
  },
]

useToolPageSchema({
  path: '/tools/jwt-decoder',
  title: 'JWT Decoder & Verifier',
  description: 'Decode and verify JSON Web Tokens online. Inspect the header and payload, read standard claims, check expiry, and verify HMAC, RSA, and ECDSA signatures — entirely in your browser.',
  ogImage: '/open_graph/og_image_default.png',
  appDescription: 'Client-side JWT decoder and signature verifier (HS/RS/ES/PS).',
  appIsFree: true,
  datePublished: '2026-05-20',
  dateModified: '2026-06-26',
  howTo: {
    name: 'How to decode and verify a JWT',
    description: 'Paste a JSON Web Token to read its header, payload, and claims, then optionally verify its signature with a secret or public key — all in your browser.',
    steps: [
      { name: 'Paste your JWT', text: 'Paste the encoded token (header.payload.signature) into the input. Decoding starts instantly and runs entirely in your browser.' },
      { name: 'Read the decoded token', text: 'Review the decoded Header and Payload JSON panels and the friendly interpretation of standard claims and expiry status.' },
      { name: 'Verify the signature', text: 'Optionally verify the signature with a shared secret for HMAC (HS*) or a public key (PEM or JWK) for RSA, RSA-PSS, and ECDSA (RS*/PS*/ES*).' },
    ],
  },
  faq: faqItems,
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

const { trackTool, trackToolError } = useAnalytics()

// --- copy-to-clipboard -----------------------------------------------------
const copied = ref<string | null>(null)
let copyTimer: ReturnType<typeof setTimeout> | null = null
function copyText(value: string, id: string) {
  if (!value || typeof navigator === 'undefined' || !navigator.clipboard)
    return
  navigator.clipboard.writeText(value).then(() => {
    copied.value = id
    trackTool('jwt-decoder', 'copy', { part: id })
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
  trackTool('jwt-decoder', 'load_sample')
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

// Debounced `decode` action once a token parses cleanly — captures real usage
// without firing on every keystroke.
let decodeTimer: ReturnType<typeof setTimeout> | null = null
watch(token, () => {
  if (decodeTimer)
    clearTimeout(decodeTimer)
  decodeTimer = setTimeout(() => {
    const d = decoded.value
    if (d.header && d.payload && !d.errors.length)
      trackTool('jwt-decoder', 'decode', { alg: algInfo.value.alg || 'unknown' })
  }, 800)
})

// Verification outcome — verified is a success action, the rest are errors.
watch(verifyState, (s) => {
  if (s === 'verified')
    trackTool('jwt-decoder', 'verify', { result: 'verified', alg: algInfo.value.alg || 'unknown' })
  else if (s === 'invalid')
    trackToolError('jwt-decoder', 'verify', 'invalid_signature')
  else if (s === 'unable')
    trackToolError('jwt-decoder', 'verify', 'unable')
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

    <!-- Reference / SEO content -->
    <section class="mt-14 border-t border-slate-200 dark:border-slate-800 pt-8 max-w-3xl">
      <span class="eyebrow">Reference</span>
      <h2 class="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Decoding and verifying JSON Web Tokens
      </h2>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        What is a JWT made of?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        A JSON Web Token (JWT) is three base64url-encoded parts separated by dots: a
        <span class="text-rose-500 font-medium">header</span> that names the signing algorithm, a
        <span class="text-fuchsia-500 font-medium">payload</span> of claims such as
        <code class="font-spacemono">sub</code>, <code class="font-spacemono">iat</code>, and
        <code class="font-spacemono">exp</code>, and a
        <span class="text-sky-500 font-medium">signature</span>. This tool parses the header and
        payload locally, interprets the standard claims, and shows the token's expiry status.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        How is decoding different from verifying?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Decoding only reads the encoded header and payload — anyone can do it, and it proves nothing
        about authenticity. Verifying checks the signature against a secret or public key, which
        confirms the token was issued by a trusted party and has not been altered. Signature
        verification here uses <code class="font-spacemono">compactVerify</code>, so it is checked
        independently of the <code class="font-spacemono">exp</code> claim: an expired but otherwise
        valid token still verifies, with expiry reported separately.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Which algorithms and keys can it verify?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        HMAC tokens (<code class="font-spacemono">HS256</code>,
        <code class="font-spacemono">HS384</code>, <code class="font-spacemono">HS512</code>) are
        verified with the shared secret used to sign them. RSA
        (<code class="font-spacemono">RS*</code>), RSA-PSS
        (<code class="font-spacemono">PS*</code>), and ECDSA
        (<code class="font-spacemono">ES*</code>) tokens are verified with the matching public key,
        supplied as PEM or JWK.
      </p>

      <h3 class="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Is it safe to inspect sensitive tokens?
      </h3>
      <p class="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
        Yes. Everything runs in your browser. Your token, secret, and keys are never uploaded or
        stored, so you can safely inspect production or otherwise sensitive tokens. You can also
        prefill the decoder by passing a token in the <code class="font-spacemono">?token=</code>
        query parameter.
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
