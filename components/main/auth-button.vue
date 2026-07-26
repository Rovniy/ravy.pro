<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

// The entire auth surface in one control:
//   signed out → a Sign in button
//   signed in  → the avatar, linking to /account
//
// Signing out deliberately lives on /account rather than here. It is a rare,
// deliberate action, and giving it permanent header space next to an Account
// link meant three controls where one does the job. On mobile this is the only
// route into the account, so the hit area is a full 44px.
const { state, isAuthed, signIn } = useAuth()
const { track } = useAnalytics()

const userInitial = computed(() => {
  const email = state.value.user?.email ?? ''
  return email ? email.at(0)?.toUpperCase() : '?'
})

// The email is the useful tooltip — it disambiguates which account is signed in.
const accountTitle = computed(() => state.value.user?.email || 'Account')

async function onSignIn() {
  try {
    await signIn()
    track('login', { method: 'firebase' })
  }
  catch (e) {
    console.error('Sign-in failed', e)
  }
}
</script>

<template>
  <ClientOnly>
    <NuxtLink
      v-if="state.ready && isAuthed"
      to="/account"
      :title="accountTitle"
      aria-label="Account"
      class="auth-control group"
      @click="track('nav_click', { nav_item: 'account', location: 'header' })"
    >
      <span class="auth-avatar inline-flex items-center justify-center w-7 h-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-1 ring-slate-300 dark:ring-slate-600 group-hover:ring-accent-400 dark:group-hover:ring-accent-500 transition-shadow">
        <img
          v-if="state.user?.photoURL"
          :src="state.user.photoURL"
          alt=""
          class="w-full h-full object-cover"
        >
        <span v-else class="text-xs font-bold uppercase text-slate-700 dark:text-slate-200">
          {{ userInitial }}
        </span>
      </span>
    </NuxtLink>

    <button
      v-else-if="state.ready"
      type="button"
      title="Sign in"
      class="auth-control text-sm lg:text-base font-medium hover:text-accent-600 dark:hover:text-accent-400 hover:cursor-pointer"
      @click="onSignIn"
    >
      <Icon name="mdi:login" size="20" aria-hidden="true" />
      <span class="hidden lg:inline">Sign in</span>
    </button>

    <template #fallback>
      <span class="auth-control text-slate-400">
        <Icon name="svg-spinners:180-ring" size="18" aria-hidden="true" />
      </span>
    </template>
  </ClientOnly>
</template>

<style>
@reference "../../assets/css/tailwind.css";

/* Matches the theme toggle's 44px touch target and vertical trim so the two
   sit on one baseline in the header pill. */
.auth-control {
  @apply inline-flex items-center justify-center gap-1.5 h-11 min-w-11 px-1.5 -my-2 rounded-md transition-colors;
}

.auth-control:focus {
  @apply outline-none;
}

.auth-control:focus-visible {
  @apply outline-2 outline-offset-2 outline-accent-500;
}

/* On /account the avatar carries the active state the removed nav link used to. */
.auth-control.router-link-active .auth-avatar {
  @apply ring-accent-500 dark:ring-accent-400;
}
</style>
