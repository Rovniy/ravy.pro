<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { useRoute } from 'vue-router'
import { useAuth } from '~/composables/useAuth'
import { adminServices, navbarData, publicServices } from '~/data'

const { y } = useWindowScroll()
const { state, isAuthed, isAdmin, signIn, signOut } = useAuth()

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

const userInitial = computed(() => {
  const email = state.value.user?.email ?? ''
  return email ? email?.at(0)?.toUpperCase() : '?'
})

async function onSignIn() {
  try {
    await signIn()
  }
  catch (e) {
    console.error('Sign-in failed', e)
  }
}
</script>

<template>
  <header
    ref="headerRef"
    class="fixed w-full z-10 transition-all duration-300"
    :class="scrolled
      ? 'bg-[#F1F2F4]/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent shadow-sm py-2'
      : 'bg-[#F1F2F4] dark:bg-slate-950 border-b border-transparent py-5'"
  >
    <div class="flex px-6 container max-w-5xl justify-between mx-auto items-center">
      <ul class="flex items-baseline space-x-5">
        <li class="text-base lg:text-2xl font-bold">
          <NuxtLink to="/" class="nav-link">
            {{ navbarData.homeTitle }}
          </NuxtLink>
        </li>
      </ul>

      <ul class="flex items-center space-x-3 lg:space-x-6 text-sm lg:text-lg font-semibold">
        <li class="hidden lg:block">
          <NuxtLink to="/blogs" class="nav-link hover:text-sky-700">
            Blogs
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <NuxtLink to="/categories" class="nav-link hover:text-sky-700">
            Categories
          </NuxtLink>
        </li>
        <li class="hidden lg:block" title="About Me">
          <NuxtLink to="/about" aria-label="About me" class="nav-link hover:text-sky-700">
            About
          </NuxtLink>
        </li>
        <li v-if="isAuthed" class="hidden lg:block">
          <NuxtLink to="/account" class="nav-link hover:text-sky-700">
            Account
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <MainToolsMenu />
        </li>
        <ClientOnly>
          <li v-if="isAdmin" class="hidden lg:block">
            <MainServicesMenu />
          </li>
        </ClientOnly>
        <li class="flex items-center gap-2">
          <ClientOnly>
            <button
              v-if="state.ready && !isAuthed"
              type="button"
              title="Sign in"
              class="inline-flex items-center gap-1.5 hover:text-sky-700 hover:cursor-pointer text-sm lg:text-base font-medium"
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
                class="inline-block w-6 h-6 rounded-full overflow-hidden bg-zinc-300 dark:bg-zinc-700"
              >
                <img :src="state.user.photoURL" alt="avatar" class="w-full h-full object-cover">
              </span>
              <span
                v-else
                :title="state.user?.email ?? ''"
                class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 text-xs font-bold uppercase"
              >
                {{ userInitial }}
              </span>
              <button
                type="button"
                title="Sign out"
                class="hover:text-sky-700 hover:cursor-pointer text-sm lg:text-base font-medium flex items-center gap-2"
                @click="signOut"
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
            class="inline-flex items-center justify-center w-9 h-9 -mr-2 hover:text-sky-700 hover:cursor-pointer"
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
        class="lg:hidden absolute left-0 right-0 top-full bg-[#F1F2F4]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-lg"
        aria-label="Mobile navigation"
      >
        <ul class="container max-w-5xl mx-auto px-6 py-3 flex flex-col text-base font-semibold">
          <li>
            <NuxtLink to="/blogs" class="nav-link block py-3 hover:text-sky-700">
              Blogs
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/categories" class="nav-link block py-3 hover:text-sky-700">
              Categories
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about" aria-label="About me" class="nav-link block py-3 hover:text-sky-700">
              About
            </NuxtLink>
          </li>
          <li v-if="isAuthed">
            <NuxtLink to="/account" class="nav-link block py-3 hover:text-sky-700">
              Account
            </NuxtLink>
          </li>
          <li class="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Tools
          </li>
          <li v-for="item in publicServices" :key="item.path">
            <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-sky-700">
              {{ item.name }}
            </NuxtLink>
          </li>
          <ClientOnly>
            <template v-if="isAdmin">
              <li class="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Services
              </li>
              <li v-for="item in adminServices" :key="item.path">
                <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-sky-700">
                  {{ item.name }}
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
  @apply outline-2 outline-offset-4 outline-sky-500;
}

.nav-link.router-link-active {
  @apply text-sky-700 dark:text-sky-400;
}

.nav-link.router-link-exact-active {
  @apply underline underline-offset-4 decoration-2;
}
</style>
