<script setup lang="ts">
import type { GatedTool } from '~/data/services'
import type { ManagedAccount } from '~/types/access'
import { onMounted, reactive, ref } from 'vue'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

const { authedFetch } = useAuthedFetch()
const accounts = ref<ManagedAccount[]>([])
const tools = ref<GatedTool[]>([])
const loading = ref(false)
const error = ref('')
const savingEmail = ref('')
const newEmail = ref('')

// Local editable copy of each account's granted tool keys, keyed by email.
const draft = reactive<Record<string, string[]>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await authedFetch<{ accounts: ManagedAccount[], tools: GatedTool[] }>('/api/admin/access')
    accounts.value = res.accounts
    tools.value = res.tools
    for (const a of res.accounts)
      draft[a.email] = [...a.tools]
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load accounts'
  }
  finally {
    loading.value = false
  }
}

function toggle(email: string, key: string) {
  const current = draft[email] ?? []
  draft[email] = current.includes(key) ? current.filter(k => k !== key) : [...current, key]
}

function isDirty(account: ManagedAccount): boolean {
  const a = [...(draft[account.email] ?? [])].sort()
  const b = [...account.tools].sort()
  return a.length !== b.length || a.some((v, i) => v !== b[i])
}

async function save(email: string) {
  savingEmail.value = email
  error.value = ''
  try {
    await authedFetch('/api/admin/access', {
      method: 'POST',
      body: JSON.stringify({ email, tools: draft[email] ?? [] }),
    })
    await load()
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save grant'
  }
  finally {
    savingEmail.value = ''
  }
}

function addEmail() {
  const email = newEmail.value.trim().toLowerCase()
  if (!email.includes('@'))
    return
  if (!accounts.value.some(a => a.email === email)) {
    accounts.value.unshift({ email, tools: [], hasSignedIn: false })
    draft[email] = []
  }
  newEmail.value = ''
}

onMounted(load)
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Access management
        </h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Grant gated tools to specific people by email. You always have full access.
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 hover:cursor-pointer"
        @click="load"
      >
        <Icon :name="loading ? 'svg-spinners:180-ring' : 'mdi:refresh'" size="14" />
        Refresh
      </button>
    </div>

    <!-- Add email -->
    <form class="mt-4 flex flex-col sm:flex-row gap-2" @submit.prevent="addEmail">
      <input
        v-model="newEmail"
        type="email"
        placeholder="person@example.com"
        class="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/60"
      >
      <button
        type="submit"
        class="inline-flex items-center justify-center gap-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
      >
        <Icon name="mdi:account-plus-outline" class="w-4 h-4" />
        Add
      </button>
    </form>

    <p v-if="error" class="mt-3 text-sm text-rose-600 dark:text-rose-400">
      {{ error }}
    </p>

    <div v-if="loading" class="mt-4 text-sm text-slate-500">
      Loading…
    </div>
    <div v-else-if="accounts.length === 0" class="mt-4 text-sm text-slate-500">
      No accounts yet. Add an email above to grant access.
    </div>

    <ul v-else class="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
      <li v-for="account in accounts" :key="account.email" class="py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="font-medium text-slate-900 dark:text-slate-100 truncate">
            {{ account.email }}
          </p>
          <p class="text-xs" :class="account.hasSignedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
            {{ account.hasSignedIn ? 'Has signed in' : 'Not signed in yet' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label
            v-for="tool in tools"
            :key="tool.key"
            class="inline-flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200 hover:cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="(draft[account.email] ?? []).includes(tool.key)"
              class="rounded border-slate-300 dark:border-slate-600 text-sky-500 focus:ring-sky-500/60"
              @change="toggle(account.email, tool.key)"
            >
            {{ tool.name }}
          </label>
          <button
            type="button"
            :disabled="!isDirty(account) || savingEmail === account.email"
            class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed hover:cursor-pointer"
            @click="save(account.email)"
          >
            <Icon :name="savingEmail === account.email ? 'svg-spinners:180-ring' : 'mdi:content-save-outline'" size="14" />
            Save
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
