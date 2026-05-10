<script setup lang="ts">
import type { ShortLink } from '~/types/shortify'
import { computed, ref } from 'vue'
import { useRuntimeConfig } from 'nuxt/app'
import { useShortifyAuth } from '~/composables/useShortifyAuth'
import { useShortify } from '~/composables/useShortify'
import { baseData } from '~/data'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'Shortify',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const { state, signIn, signOut } = useShortifyAuth()
const { listLinks, createLink } = useShortify()

const config = useRuntimeConfig()
const adminEmailHint = (config.public.firebase as { authDomain?: string }).authDomain ? '' : ''
const baseUrl = baseData.site.url

const links = ref<ShortLink[]>([])
const loadingList = ref(false)
const submitting = ref(false)
const inputUrl = ref('')
const errorMsg = ref('')
const signInError = ref('')
const justCreated = ref<ShortLink | null>(null)

const isAuthed = computed(() => !!state.value.user)
const userEmail = computed(() => state.value.user?.email ?? null)

async function refresh() {
  if (!isAuthed.value) return
  loadingList.value = true
  errorMsg.value = ''
  try {
    links.value = await listLinks()
  }
  catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to load links'
    if (msg.includes('Forbidden') || msg.includes('403')) {
      links.value = []
    }
    else {
      errorMsg.value = msg
    }
  }
  finally {
    loadingList.value = false
  }
}

async function onSubmit() {
  if (!inputUrl.value.trim() || submitting.value) return
  submitting.value = true
  errorMsg.value = ''
  try {
    const created = await createLink(inputUrl.value.trim())
    justCreated.value = created
    inputUrl.value = ''
    links.value = [created, ...links.value]
  }
  catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Failed to create link'
  }
  finally {
    submitting.value = false
  }
}

async function onSignIn() {
  signInError.value = ''
  try {
    await signIn()
    await refresh()
  }
  catch (e: unknown) {
    signInError.value = e instanceof Error ? e.message : 'Sign-in failed'
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch { /* ignore */ }
}

function shortUrl(code: string): string {
  return `${baseUrl}/s/${code}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  }
  catch {
    return iso
  }
}

watch(isAuthed, (v) => {
  if (v) refresh()
  else links.value = []
})

if (import.meta.client) {
  watchEffect(() => {
    if (state.value.ready && isAuthed.value && links.value.length === 0)
      refresh()
  })
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-4xl">
    <header class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">
        Shortify
      </h1>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
        Personal URL shortener. Links are served from <code>{{ baseUrl }}/s/&lt;code&gt;</code>.
      </p>
    </header>

    <!-- Loading auth state -->
    <div v-if="!state.ready" class="text-zinc-500">
      Loading…
    </div>

    <!-- Not signed in -->
    <div v-else-if="!isAuthed" class="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-900/50">
      <h2 class="text-lg font-semibold mb-2">
        Sign in required
      </h2>
      <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        This area is restricted. Sign in with your Google account to continue.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90"
        @click="onSignIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
      <p v-if="signInError" class="mt-3 text-sm text-red-600 dark:text-red-400">
        {{ signInError }}
      </p>
      <p v-if="adminEmailHint" class="mt-3 text-xs text-zinc-500">
        {{ adminEmailHint }}
      </p>
    </div>

    <!-- Signed in -->
    <div v-else>
      <div class="flex items-center justify-between mb-6 text-sm">
        <span class="text-zinc-600 dark:text-zinc-400">
          Signed in as <strong>{{ userEmail }}</strong>
        </span>
        <button type="button" class="text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline" @click="signOut">
          Sign out
        </button>
      </div>

      <form class="flex flex-col sm:flex-row gap-2 mb-6" @submit.prevent="onSubmit">
        <input
          v-model="inputUrl"
          type="url"
          required
          placeholder="https://example.com/long-link"
          class="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        >
        <button
          type="submit"
          :disabled="submitting"
          class="rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {{ submitting ? 'Creating…' : 'Shorten' }}
        </button>
      </form>

      <div v-if="errorMsg" class="mb-4 text-sm text-red-600 dark:text-red-400">
        {{ errorMsg }}
      </div>

      <div v-if="justCreated" class="mb-6 rounded-md border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 p-3 text-sm">
        Created: <a class="underline font-mono" :href="shortUrl(justCreated.code)" target="_blank">{{ shortUrl(justCreated.code) }}</a>
        <button type="button" class="ml-2 text-xs underline" @click="copy(shortUrl(justCreated.code))">
          copy
        </button>
      </div>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold">
            Links
          </h2>
          <button type="button" class="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline" :disabled="loadingList" @click="refresh">
            {{ loadingList ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>

        <div v-if="!loadingList && links.length === 0" class="text-sm text-zinc-500">
          No links yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th class="py-2 pr-4">Code</th>
                <th class="py-2 pr-4">Target</th>
                <th class="py-2 pr-4">Clicks</th>
                <th class="py-2 pr-4">Created</th>
                <th class="py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="link in links" :key="link.code" class="border-b border-zinc-100 dark:border-zinc-800/50">
                <td class="py-2 pr-4 font-mono">
                  <a :href="shortUrl(link.code)" target="_blank" class="hover:underline">
                    /s/{{ link.code }}
                  </a>
                </td>
                <td class="py-2 pr-4 max-w-xs truncate">
                  <a :href="link.url" target="_blank" rel="noopener" class="hover:underline" :title="link.url">{{ link.url }}</a>
                </td>
                <td class="py-2 pr-4 tabular-nums">
                  {{ link.clicks }}
                </td>
                <td class="py-2 pr-4 text-zinc-500 whitespace-nowrap">
                  {{ formatDate(link.createdAt) }}
                </td>
                <td class="py-2 text-right">
                  <button type="button" class="text-xs underline text-zinc-500 hover:text-zinc-900 dark:hover:text-white" @click="copy(shortUrl(link.code))">
                    copy
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
