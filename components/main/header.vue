<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useAccess } from '~/composables/useAccess'
import { useAuth } from '~/composables/useAuth'
import { navbarData, publicServices } from '~/data'

const { y } = useWindowScroll()
const { state, isAuthed, signIn, signOut } = useAuth()
const { accessibleServices, isAdmin } = useAccess()

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

const { track } = useAnalytics()
function navClick(item: string, location: 'header' | 'mobile' = 'header') {
  track('nav_click', { nav_item: item, location })
}

const userInitial = computed(() => {
  const email = state.value.user?.email ?? ''
  return email ? email?.at(0)?.toUpperCase() : '?'
})

async function onSignIn() {
  try {
    await signIn()
    track('login', { method: 'firebase' })
  }
  catch (e) {
    console.error('Sign-in failed', e)
  }
}

async function onSignOut() {
  track('logout', { method: 'firebase' })
  await signOut()
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
          <NuxtLink to="/" class="nav-link inline-flex items-center gap-2.5" @click="navClick('home')">
            <span class="w-2 h-2 rounded-full bg-gradient-to-br from-accent-400 to-emerald-500 shadow-[0_0_8px] shadow-accent-400/60" aria-hidden="true" />
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
        <li v-if="isAuthed" class="hidden lg:block">
          <NuxtLink to="/account" class="nav-link hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('account')">
            Account
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <MainToolsMenu />
        </li>
        <li class="hidden lg:block" title="About Me">
          <NuxtLink to="/about" aria-label="About me" class="nav-link hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('about')">
            About me
          </NuxtLink>
        </li>
        <ClientOnly>
          <li v-if="accessibleServices.length" class="hidden lg:block">
            <MainServicesMenu />
          </li>
        </ClientOnly>
        <li class="flex items-center">
          <UiThemeToggle
            icon-size="20"
            class="inline-flex items-center justify-center w-11 h-11 -my-2"
          />
        </li>
        <li class="flex items-center gap-2">
          <ClientOnly>
            <button
              v-if="state.ready && !isAuthed"
              type="button"
              title="Sign in"
              class="inline-flex items-center gap-1.5 hover:text-accent-600 dark:hover:text-accent-400 hover:cursor-pointer text-sm lg:text-base font-medium"
              @click="onSignIn"
            >
              <Icon name="mdi:login" size="22" aria-hidden="true" class="lg:hidden" />
            </button>
            <span
              v-else-if="state.ready && isAuthed"
              class="inline-flex items-center gap-2"
            >
              <span
                v-if="state.user?.photoURL"
                :title="state.user.email ?? ''"
                class="inline-block w-6 h-6 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700"
              >
                <img :src="state.user.photoURL" alt="avatar" class="w-full h-full object-cover">
              </span>
              <span
                v-else
                :title="state.user?.email ?? ''"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-xs font-bold uppercase"
              >
                {{ userInitial }}
              </span>
              <button
                type="button"
                title="Sign out"
                class="hover:text-accent-600 dark:hover:text-accent-400 hover:cursor-pointer text-sm lg:text-base font-medium flex items-center gap-2"
                @click="onSignOut"
              >
                <span class="hidden lg:inline">Sign out</span>
                <Icon name="mdi:logout" size="18" aria-hidden="true" class="lg:hidden" />
              </button>
            </span>
            <template #fallback>
              <Icon name="svg-spinners:180-ring" size="18" aria-hidden="true" />
            </template>
          </ClientOnly>
        </li>
        <li class="lg:hidden">
          <button
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
        class="lg:hidden absolute left-4 right-4 sm:left-6 sm:right-6 top-full mt-2 rounded-2xl overflow-hidden bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 shadow-xl shadow-slate-950/10 dark:shadow-black/30"
        aria-label="Mobile navigation"
      >
        <ul class="px-6 py-3 flex flex-col text-base font-semibold">
          <li>
            <NuxtLink to="/blogs" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('blogs', 'mobile')">
              Blogs
            </NuxtLink>
          </li>
          <li v-if="isAuthed">
            <NuxtLink to="/account" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('account', 'mobile')">
              Account
            </NuxtLink>
          </li>
          <li class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Tools
          </li>
          <li>
            <NuxtLink to="/about" aria-label="About me" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick('about', 'mobile')">
              About me
            </NuxtLink>
          </li>
          <li v-for="item in publicServices" :key="item.path">
            <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400" @click="navClick(item.path, 'mobile')">
              {{ item.name }}
            </NuxtLink>
          </li>
          <ClientOnly>
            <template v-if="accessibleServices.length">
              <li class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Services
              </li>
              <li v-for="item in accessibleServices" :key="item.path">
                <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400">
                  {{ item.name }}
                </NuxtLink>
              </li>
              <li v-if="isAdmin">
                <NuxtLink to="/account?tab=access" class="nav-link block py-3 hover:text-accent-600 dark:hover:text-accent-400">
                  Manage access
                </NuxtLink>
              </li>
            </template>
          </ClientOnly>
        </ul>
      </nav>
    </Transition>
  </header>
</template>

<style>
@reference "../../assets/css/tailwind.css";

.nav-link {
  @apply rounded-sm transition-colors;
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

.nav-link.router-link-exact-active {
  @apply underline underline-offset-4 decoration-2;
}
</style>
