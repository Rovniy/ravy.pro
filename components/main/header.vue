<script setup lang="ts">
import { navbarData } from '~/data'
import { useAuth } from '~/composables/useAuth'

const colorMode = useColorMode()
const { y } = useWindowScroll()
const { state, isAuthed, isAdmin, signIn, signOut } = useAuth()

const scrolled = computed(() => y.value > 20)

function onClick(val: string) {
  colorMode.preference = val
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
    class="fixed w-full z-10 transition-all duration-300"
    :class="scrolled
      ? 'bg-[#F1F2F4]/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-transparent shadow-sm py-2'
      : 'bg-[#F1F2F4] dark:bg-slate-950 border-b border-transparent py-5'"
  >
    <div class="flex px-6 container max-w-5xl justify-between mx-auto items-baseline">
      <ul class="flex items-baseline space-x-5">
        <li class="text-base sm:text-2xl font-bold">
          <NuxtLink to="/">
            {{ navbarData.homeTitle }}
          </NuxtLink>
        </li>
      </ul>

      <ul class="flex items-center space-x-3 sm:space-x-6 text-sm sm:text-lg font-semibold">
        <li>
          <NuxtLink to="/blogs" class="hover:text-sky-700">
            Blogs
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/categories" class="hover:text-sky-700">
            Categories
          </NuxtLink>
        </li>
        <li title="About Me">
          <NuxtLink to="/about" aria-label="About me" class="hover:text-sky-700">
            About
          </NuxtLink>
        </li>
        <ClientOnly>
          <li v-if="isAdmin">
            <NuxtLink to="/shortify" class="hover:text-sky-700">
              Shortify
            </NuxtLink>
          </li>
        </ClientOnly>
        <li class="w-[22px]">
          <ClientOnly>
            <button
              v-if="colorMode.value === 'light'"
              name="light-mode"
              title="Light"
              class="hover:scale-110 transition-all ease-out hover:cursor-pointer w-5.5 flex"
              @click="onClick('dark')"
            >
              <Icon name="icon-park:moon" size="22" />
            </button>
            <button
              v-if="colorMode.value === 'dark'"
              name="dark-mode"
              title="Dark"
              class="hover:scale-110 transition-all ease-out hover:cursor-pointer w-5.5 flex"
              @click="onClick('light')"
            >
              <Icon name="noto:sun" size="22" />
            </button>
            <template #fallback>
              <Icon name="svg-spinners:180-ring" size="22" />
            </template>
          </ClientOnly>
        </li>
        <li class="flex items-center gap-2">
          <ClientOnly>
            <button
              v-if="state.ready && !isAuthed"
              type="button"
              title="Sign in"
              class="inline-flex items-center gap-1.5 hover:text-sky-700 hover:cursor-pointer text-sm sm:text-base font-medium"
              @click="onSignIn"
            >
              <span class="hidden sm:inline">Sign in</span>
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
                class="hover:text-sky-700 hover:cursor-pointer text-sm sm:text-base font-medium flex items-center gap-2"
                @click="signOut"
              >
                <span class="hidden sm:inline">Sign out</span>
                <Icon name="mdi:logout" size="18" class="sm:hidden" />
              </button>
            </span>
            <template #fallback>
              <Icon name="svg-spinners:180-ring" size="18" />
            </template>
          </ClientOnly>
        </li>
      </ul>
    </div>
  </header>
</template>

<style>
.router-link-active .router-link-exact-active {
  @apply underline
}
</style>
