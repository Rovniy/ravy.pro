<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAccess } from '~/composables/useAccess'
import { useAuth } from '~/composables/useAuth'

// Same three states as /shortify: auth still resolving, signed out, signed in
// without the grant. The slot only mounts in the fourth state, which is what
// keeps the editor from firing admin requests it would get a 403 for.
const { state, isAuthed, signIn } = useAuth()
const { hasTool } = useAccess()

const canUse = computed(() => hasTool('studio'))
const signInError = ref('')

async function onSignIn() {
  signInError.value = ''
  try {
    await signIn()
  }
  catch (e: unknown) {
    signInError.value = e instanceof Error ? e.message : 'Sign-in failed'
  }
}
</script>

<template>
  <div v-if="!state.ready" class="text-slate-500">
    Loading…
  </div>

  <div v-else-if="!isAuthed" class="rounded-lg border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
    <h2 class="text-lg font-semibold mb-2">
      Sign in required
    </h2>
    <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
      This area is restricted.
    </p>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-sm font-medium hover:opacity-90 hover:cursor-pointer"
      @click="onSignIn"
    >
      <Icon name="mdi:google" class="w-4 h-4" />
      Sign in with Google
    </button>
    <p v-if="signInError" class="mt-3 text-sm text-red-600 dark:text-red-400">
      {{ signInError }}
    </p>
  </div>

  <div v-else-if="!canUse" class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
    <h2 class="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">
      Access denied
    </h2>
    <p class="text-sm text-red-700/80 dark:text-red-300/80 mb-4">
      Your account <strong>{{ state.user?.email }}</strong> is not authorized to publish posts.
    </p>
    <NuxtLink to="/account" class="text-sm underline hover:no-underline">
      Sign out from your account settings
    </NuxtLink>
  </div>

  <slot v-else />
</template>
