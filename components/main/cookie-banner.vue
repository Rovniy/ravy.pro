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
      class="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
    >
      <!-- The wrapper spans the full width but the card is centred at max-w-4xl,
           so without pointer-events-none the invisible remainder swallows clicks
           on whatever sits in that bottom strip (footer links, the theme
           switch). Only the card itself should be interactive. -->
      <div class="pointer-events-auto mx-auto max-w-4xl border border-line bg-panel">
        <div class="p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <Icon name="mdi:cookie-outline" size="24" aria-hidden="true" class="shrink-0 text-accent-500 mt-0.5" />
            <div class="flex-1 min-w-0">
              <h2 id="cookie-banner-title" class="text-base font-semibold text-fg">
                We use cookies
              </h2>
              <p class="mt-1 text-sm text-fg-muted leading-relaxed">
                We use strictly-necessary cookies to make this site work, and — only with your consent — analytics and advertising cookies via Google Tag Manager.
                See our
                <NuxtLink to="/docs/privacy-policy" class="text-accent-ink underline underline-offset-2 hover:no-underline">
                  Privacy Policy
                </NuxtLink>
                for details.
              </p>
            </div>
          </div>

          <div v-if="expanded" class="mt-5 grid gap-3 border-t border-line pt-5">
            <label class="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked
                disabled
                class="mt-1 text-accent-500 disabled:opacity-50"
              >
              <span>
                <span class="font-medium text-fg">Strictly necessary</span>
                <span class="block text-fg-muted text-xs">Required for the site to work (security, auth, dark mode). Cannot be disabled.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.analytics_storage === 'granted'"
                class="mt-1 text-accent-500"
                @change="(e) => setPending('analytics_storage', (e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-fg">Analytics</span>
                <span class="block text-fg-muted text-xs">Helps us understand how visitors use the site (page views, navigation). No personal profiles.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.ad_storage === 'granted'"
                class="mt-1 text-accent-500"
                @change="(e) => onToggleAds((e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-fg">Advertising</span>
                <span class="block text-fg-muted text-xs">Used for ad measurement and personalization where applicable.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                :checked="state.personalization_storage === 'granted'"
                class="mt-1 text-accent-500"
                @change="(e) => setPending('personalization_storage', (e.target as HTMLInputElement).checked)"
              >
              <span>
                <span class="font-medium text-fg">Personalization</span>
                <span class="block text-fg-muted text-xs">Remembers content preferences across visits.</span>
              </span>
            </label>
          </div>

          <div class="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              v-if="!expanded"
              type="button"
              class="text-sm font-medium px-4 py-2.5 text-fg-muted hover:text-accent-ink transition-colors"
              @click="expanded = true"
            >
              Customize
            </button>
            <button
              v-if="!expanded"
              type="button"
              class="skew-box btn btn-secondary btn-sm"
              @click="onReject"
            >
              Reject all
            </button>
            <button
              v-if="expanded"
              type="button"
              class="skew-box btn btn-secondary btn-sm"
              @click="onSavePrefs"
            >
              Save preferences
            </button>
            <button
              type="button"
              class="skew-box btn btn-primary btn-sm"
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
