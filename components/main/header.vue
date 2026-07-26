<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useAccess } from '~/composables/useAccess'
import { navbarData, publicServices } from '~/data'

const { y } = useWindowScroll()
// Auth lives entirely in <MainAuthButton>; the header only needs access grants
// to decide whether to list private tools.
const { accessibleServices } = useAccess()

const scrolled = computed(() => y.value > 20)

const isMobileOpen = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const route = useRoute()

onClickOutside(headerRef, () => {
  isMobileOpen.value = false
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape')
    isMobileOpen.value = false
})

watch(() => route.fullPath, () => {
  isMobileOpen.value = false
})

function toggleMobile() {
  isMobileOpen.value = !isMobileOpen.value
}

// Focus management for the mobile menu: move focus into the menu when it
// opens, keep Tab cycling inside it, and hand focus back to the toggle
// button when it closes — otherwise keyboard users are left stranded
// behind an overlay they can't see.
const mobileNavRef = ref<HTMLElement | null>(null)
const mobileToggleRef = ref<HTMLElement | null>(null)

watch(isMobileOpen, async (open) => {
  if (open) {
    await nextTick()
    mobileNavRef.value?.querySelector<HTMLElement>('a, button')?.focus()
  }
  else if (mobileNavRef.value?.contains(document.activeElement)) {
    mobileToggleRef.value?.focus()
  }
})

function onMobileNavKeydown(e: KeyboardEvent) {
  if (e.key !== 'Tab')
    return
  const focusables = mobileNavRef.value?.querySelectorAll<HTMLElement>('a, button')
  if (!focusables?.length)
    return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  }
  else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

const { track } = useAnalytics()
function navClick(item: string, location: 'header' | 'mobile' = 'header') {
  track('nav_click', { nav_item: item, location })
}
</script>

<template>
  <header
    ref="headerRef"
    class="fixed inset-x-0 top-0 z-10 px-4 sm:px-6 pt-3"
  >
    <div
      class="flex px-4 sm:px-5 container max-w-5xl justify-between mx-auto items-center rounded-2xl border backdrop-blur-xl transition-all duration-300"
      :class="scrolled
        ? 'py-2 bg-white/85 dark:bg-slate-950/85 border-slate-200/70 dark:border-white/10 shadow-lg shadow-slate-950/5 dark:shadow-black/20'
        : 'py-2.5 bg-white/70 dark:bg-slate-950/70 border-slate-200/60 dark:border-white/5 shadow-sm shadow-slate-950/5'"
    >
      <ul class="flex items-baseline space-x-5">
        <li class="text-base lg:text-2xl font-bold">
          <NuxtLink to="/" class="nav-link nav-brand inline-flex items-center gap-2.5" @click="navClick('home')">
            <span class="logo-dot w-2 h-2 rounded-full bg-gradient-to-br from-accent-400 to-emerald-500 shadow-[0_0_8px] shadow-accent-400/60" aria-hidden="true" />
            {{ navbarData.homeTitle }}
          </NuxtLink>
        </li>
      </ul>

      <ul class="flex items-center space-x-3 lg:space-x-6 text-sm lg:text-lg font-semibold">
        <li class="hidden lg:block">
          <NuxtLink to="/blogs" class="nav-link hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('blogs')">
            Blogs
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <MainToolsMenu />
        </li>
        <li class="hidden lg:block">
          <NuxtLink to="/services" class="nav-link hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('services')">
            Services
          </NuxtLink>
        </li>
        <li class="hidden lg:block" title="About Me">
          <NuxtLink to="/about" aria-label="About me" class="nav-link hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('about')">
            About
          </NuxtLink>
        </li>
        <!-- Theme switching lives in the floating control at the bottom-left
             (layouts/default.vue) so the header carries navigation only. -->
        <li class="flex items-center">
          <MainAuthButton />
        </li>
        <li class="lg:hidden">
          <button
            ref="mobileToggleRef"
            type="button"
            class="inline-flex items-center justify-center w-11 h-11 -my-1 -mr-3 hover:text-accent-600 dark:hover:text-accent-400 hover:cursor-pointer"
            :aria-expanded="isMobileOpen"
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            @click="toggleMobile"
          >
            <Icon :name="isMobileOpen ? 'mdi:close' : 'mdi:menu'" size="26" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="isMobileOpen"
        id="mobile-nav"
        ref="mobileNavRef"
        class="lg:hidden absolute left-4 right-4 sm:left-6 sm:right-6 top-full mt-2 rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-xl shadow-slate-950/10 dark:shadow-black/30"
        aria-label="Mobile navigation"
        @keydown="onMobileNavKeydown"
      >
        <ul class="px-6 py-3 flex flex-col text-base font-semibold max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain">
          <li>
            <NuxtLink to="/blogs" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('blogs', 'mobile')">
              Blogs
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/services" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('services', 'mobile')">
              Services
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about" aria-label="About me" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('about', 'mobile')">
              About me
            </NuxtLink>
          </li>
          <li class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tools
          </li>
          <li v-for="item in publicServices" :key="item.path">
            <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick(item.path, 'mobile')">
              {{ item.name }}
            </NuxtLink>
          </li>
          <!-- Access-granted tools sit in the same Tools group, resolved
               client-side so only the people who have them see the rows.
               Access management itself lives on /account (Access tab). -->
          <ClientOnly>
            <li v-for="item in accessibleServices" :key="item.path">
              <NuxtLink :to="item.path" class="nav-link flex items-center gap-2 py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick(item.path, 'mobile')">
                {{ item.name }}
                <span class="font-spacemono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">private</span>
              </NuxtLink>
            </li>
          </ClientOnly>
          <!-- No Account row here: the avatar in the bar above is the single
               entry point into the account, on mobile as well as desktop. -->
        </ul>
      </nav>
    </Transition>
  </header>
</template>

<style>
@reference "../../assets/css/tailwind.css";

.nav-link {
  @apply relative rounded-sm transition-colors;
}

.nav-link:focus {
  @apply outline-none;
}

.nav-link:focus-visible {
  @apply outline-2 outline-offset-4 outline-accent-500;
}

.nav-link.router-link-active {
  @apply text-accent-600 dark:text-accent-400;
}

/* Animated gradient underline — grows from the left on hover, stays on the
   exact-active link. The brand link opts out (a logo doesn't carry nav state). */
.nav-link:not(.nav-brand)::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  height: 2px;
  width: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--color-accent-500), var(--color-emerald-400));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s var(--ease-expo);
}
@media (hover: hover) {
  .nav-link:not(.nav-brand):hover::after {
    transform: scaleX(1);
  }
}
.nav-link:not(.nav-brand).router-link-exact-active::after {
  transform: scaleX(1);
}

/* In the mobile sheet links are full-width block rows — a full-width bar reads
   as a divider, so shrink the underline to a short accent tick instead. */
#mobile-nav .nav-link::after {
  width: 2.25rem;
  bottom: 0.45rem;
}

/* The brand dot breathes — a slow glow pulse that signals "live" without
   demanding attention. */
@media (prefers-reduced-motion: no-preference) {
  .logo-dot {
    animation: logo-breathe 4s ease-in-out infinite;
  }
}
@keyframes logo-breathe {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 8px color-mix(in oklab, var(--color-accent-400) 60%, transparent);
  }
  50% {
    transform: scale(1.25);
    box-shadow: 0 0 14px color-mix(in oklab, var(--color-accent-400) 90%, transparent);
  }
}
</style>
