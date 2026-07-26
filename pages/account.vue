<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccess } from '~/composables/useAccess'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
})

useGenericPageSchema({
  url: 'https://ravy.pro/account',
  name: 'Account',
  description: 'Your account, service history, and settings.',
  type: 'WebPage',
})

useHead({
  title: 'Account',
  meta: [
    { name: 'description', content: 'Your account, service history, and settings.' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const { state, isAuthed, signIn, signOut } = useAuth()
const { hasTool, isAdmin } = useAccess()
const { track } = useAnalytics()
const route = useRoute()
const router = useRouter()

// Signing out lives here rather than in the header: it's the one place the
// action belongs, and it keeps the header's auth control to a single element.
// Redirect home afterwards — this page is private, so lingering on it would
// just swap the tabs for a sign-in prompt.
const signingOut = ref(false)

async function onSignOut() {
  if (signingOut.value)
    return
  signingOut.value = true
  try {
    track('logout', { method: 'firebase' })
    await signOut()
    await router.push('/')
  }
  finally {
    signingOut.value = false
  }
}

const tabs = computed(() => {
  const list = [
    { key: 'profile', label: 'Profile', icon: 'mdi:account-outline' },
    { key: 'steam', label: 'Steam AI Disclosure', icon: 'mdi:steam' },
  ]
  if (hasTool('contract-scanner'))
    list.push({ key: 'scans', label: 'Red-Flag Scanner', icon: 'mdi:shield-search' })
  if (isAdmin.value) {
    list.push({ key: 'access', label: 'Access', icon: 'mdi:account-key-outline' })
    list.push({ key: 'audit', label: 'Audit log', icon: 'mdi:history' })
  }
  return list
})

const activeTab = ref('profile')

// Sync the active tab with ?tab=, falling back to Profile when the requested
// tab isn't available to this user (e.g. access tab for non-admins).
watch(
  [() => route.query.tab, tabs],
  () => {
    const requested = String(route.query.tab || 'profile')
    activeTab.value = tabs.value.some(t => t.key === requested) ? requested : 'profile'
  },
  { immediate: true },
)

function selectTab(key: string) {
  activeTab.value = key
  router.replace({ query: { ...route.query, tab: key } })
}
</script>

<template>
  <div class="px-6 py-12 mx-auto w-full max-w-5xl">
    <div class="flex items-start justify-between gap-x-6">
      <div class="min-w-0 flex-1">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account
        </h1>
        <p v-if="state.ready && isAuthed && state.user?.email" class="mt-1.5 font-spacemono text-xs text-slate-500 dark:text-slate-400 truncate">
          {{ state.user.email }}
        </p>
      </div>

      <button
        v-if="state.ready && isAuthed"
        type="button"
        :disabled="signingOut"
        class="shrink-0 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 disabled:opacity-50 hover:cursor-pointer transition-colors"
        @click="onSignOut"
      >
        <Icon :name="signingOut ? 'svg-spinners:180-ring' : 'mdi:logout'" size="16" aria-hidden="true" />
        {{ signingOut ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>

    <div v-if="!state.ready" class="mt-6 text-slate-500">
      Loading…
    </div>

    <div v-else-if="!isAuthed" class="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Sign in to see your service history and settings.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
        @click="signIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
    </div>

    <div v-else class="mt-6">
      <AccountTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />

      <div class="mt-6">
        <AccountProfileSettings v-if="activeTab === 'profile'" />
        <AccountSteamHistory v-else-if="activeTab === 'steam'" />
        <AccountScanHistory v-else-if="activeTab === 'scans' && hasTool('contract-scanner')" />
        <AccountAccessManager v-else-if="activeTab === 'access' && isAdmin" />
        <AccountAccessAuditLog v-else-if="activeTab === 'audit' && isAdmin" />
      </div>
    </div>
  </div>
</template>
