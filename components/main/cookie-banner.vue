<script setup lang="ts">
import { useCookieConsent } from '~/composables/useCookieConsent'

const { decided, state, hydrate, acceptAll, rejectAll, setPending, commit } = useCookieConsent()

const expanded = ref(false)

// Run hydration synchronously in setup (component is inside <ClientOnly>, so
// this only runs on the client where window.localStorage exists). Doing it
// here instead of in onMounted ensures the first render already has the
// correct `decided` value, eliminating a one-frame flash of the banner for
// returning visitors who have already chosen.
hydrate()

const visible = computed(() => !decided.value)

function onAccept() {
  acceptAll()
  expanded.value = false
}

function onReject() {
  rejectAll()
  expanded.value = false
}

function onSavePrefs() {
  commit()
  expanded.value = false
}

function onToggleAds(granted: boolean) {
  setPending('ad_storage', granted)
  setPending('ad_user_data', granted)
  setPending('ad_personalization', granted)
}
</script>

<template>
  <Transition name="banner">
    <div
      v-if="visible"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      class="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div class="mx-auto max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg shadow-2xl shadow-black/20">
        <div class="p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <Icon name="mdi:cookie-outline" size="24" aria-hidden="true" class="shrink-0 text-sky-500 mt-0.5" />
            <div class="flex-1 min-w-0">
              <h2 id="cookie-banner-title" class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                We use cookies
              </h2>
              <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use strictly-necessary cookies to make this site work, and — only with your consent — analytics and advertising cookies via Google Tag Manager.
                See our
                <NuxtLink to="/docs/privacy-policy" class="text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:no-underline">
                  Privacy Policy
                </NuxtLink>
                for details.
              </p>
            </div>
          </div>

          <div v-if="expanded" class="mt-5 grid gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-5">
            <label class="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked
                disabled
                class="mt-1 rounded text-sky-500 disabled:opacity-50"
              >
              <span>
                <span class="font-medium text-zinc-900 dark:text-zinc-100">Strictly necessary</span>
                <span class="block text-zinc-500 dark:text-zinc-400 text-xs">Required for the site to work (security, auth, dark mode). Cannot be disabled.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.analytics_storage === 'granted'"
                class="mt-1 rounded text-sky-500"
                @change="(e) => setPending('analytics_storage', (e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-zinc-900 dark:text-zinc-100">Analytics</span>
                <span class="block text-zinc-500 dark:text-zinc-400 text-xs">Helps us understand how visitors use the site (page views, navigation). No personal profiles.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.ad_storage === 'granted'"
                class="mt-1 rounded text-sky-500"
                @change="(e) => onToggleAds((e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-zinc-900 dark:text-zinc-100">Advertising</span>
                <span class="block text-zinc-500 dark:text-zinc-400 text-xs">Used for ad measurement and personalization where applicable.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.personalization_storage === 'granted'"
                class="mt-1 rounded text-sky-500"
                @change="(e) => setPending('personalization_storage', (e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-zinc-900 dark:text-zinc-100">Personalization</span>
                <span class="block text-zinc-500 dark:text-zinc-400 text-xs">Remembers content preferences across visits.</span>
              </span>
            </label>
          </div>

          <div class="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              v-if="!expanded"
              type="button"
              class="text-sm font-medium px-4 py-2.5 rounded-full text-zinc-600 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              @click="expanded = true"
            >
              Customize
            </button>
            <button
              v-if="!expanded"
              type="button"
              class="text-sm font-medium px-5 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              @click="onReject"
            >
              Reject all
            </button>
            <button
              v-if="expanded"
              type="button"
              class="text-sm font-medium px-5 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              @click="onSavePrefs"
            >
              Save preferences
            </button>
            <button
              type="button"
              class="text-sm font-semibold px-5 py-2.5 rounded-full text-white bg-gradient-to-r from-sky-500 to-violet-500 shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-shadow"
              @click="onAccept"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
