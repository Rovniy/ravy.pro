<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useAuthedFetch } from '~/composables/useAuthedFetch'

const { state, signOut } = useAuth()
const { authedFetch } = useAuthedFetch()

const language = ref<'en' | 'ru'>('en')
const loading = ref(false)
const saving = ref(false)
const status = ref('')
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const profile = await authedFetch<{ language: 'en' | 'ru' }>('/api/account/profile')
    language.value = profile.language
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load profile'
  }
  finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  status.value = ''
  error.value = ''
  try {
    await authedFetch('/api/account/profile', {
      method: 'POST',
      body: JSON.stringify({ language: language.value }),
    })
    status.value = 'Saved'
  }
  catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save profile'
  }
  finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 space-y-5">
    <div>
      <span class="block text-sm text-slate-500 dark:text-slate-400">Signed in as</span>
      <span class="font-medium text-slate-900 dark:text-slate-100">{{ state.user?.email }}</span>
    </div>

    <div>
      <label class="block mb-1 text-sm font-medium text-slate-900 dark:text-slate-100">Response language</label>
      <select
        v-model="language"
        :disabled="loading || saving"
        class="w-full max-w-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
      >
        <option value="en">
          English
        </option>
        <option value="ru">
          Русский
        </option>
      </select>
      <p class="mt-1 text-xs text-slate-400">
        Used for AI-generated output in your tools.
      </p>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        :disabled="loading || saving"
        class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 hover:cursor-pointer"
        @click="save"
      >
        <Icon :name="saving ? 'svg-spinners:180-ring' : 'mdi:content-save-outline'" size="16" />
        {{ saving ? 'Saving…' : 'Save settings' }}
      </button>
      <button type="button" class="text-sm underline hover:cursor-pointer" @click="signOut">
        Sign out
      </button>
    </div>

    <p v-if="status" class="text-sm text-emerald-600 dark:text-emerald-400">
      {{ status }}
    </p>
    <p v-if="error" class="text-sm text-rose-600 dark:text-rose-400">
      {{ error }}
    </p>
  </section>
</template>
