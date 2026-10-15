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

const { state, isAuthed, signIn, signOut } = useAuth({ eager: true })
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
  // The MCP endpoint is gated by the studio grant, so the guide is too.
  if (hasTool('studio'))
    list.push({ key: 'mcp', label: 'MCP', icon: 'mdi:connection' })
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
        <h1 class="text-4xl font-display font-extrabold uppercase text-fg leading-none">
          Account
        </h1>
        <p v-if="state.ready && isAuthed && state.user?.email" class="mt-1.5 font-spacemono text-xs text-fg-muted truncate">
          {{ state.user.email }}
        </p>
      </div>

      <button
        v-if="state.ready && isAuthed"
        type="button"
        :disabled="signingOut"
        class="skew-box btn btn-secondary btn-sm shrink-0"
        @click="onSignOut"
      >
        <Icon :name="signingOut ? 'svg-spinners:180-ring' : 'mdi:logout'" size="16" aria-hidden="true" />
        {{ signingOut ? 'Signing out…' : 'Sign out' }}
      </button>
    </div>

    <div v-if="!state.ready" class="mt-6 text-slate-500">
      Loading…
    </div>

    <div v-else-if="!isAuthed" class="mt-6 border border-line p-6 bg-panel-raised">
      <p class="text-sm text-fg-muted mb-4">
        Sign in to see your service history and settings.
      </p>
      <button
        type="button"
        class="skew-box btn btn-primary btn-sm"
        @click="signIn"
      >
        <Icon name="mdi:google" class="w-4 h-4" />
        Sign in with Google
      </button>
    </div>

    <div v-else class="mt-6">
      <AccountGrantedTools />

      <AccountTabs :tabs="tabs" :model-value="activeTab" @update:model-value="selectTab" />

      <div class="mt-6">
        <AccountProfileSettings v-if="activeTab === 'profile'" />
        <AccountSteamHistory v-else-if="activeTab === 'steam'" />
        <AccountScanHistory v-else-if="activeTab === 'scans' && hasTool('contract-scanner')" />
        <AccountMcpConnect v-else-if="activeTab === 'mcp' && hasTool('studio')" />
        <AccountAccessManager v-else-if="activeTab === 'access' && isAdmin" />
        <AccountAccessAuditLog v-else-if="activeTab === 'audit' && isAdmin" />
      </div>
    </div>
  </div>
</template>
