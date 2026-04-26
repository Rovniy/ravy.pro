<script setup lang="ts">
import { navbarData } from '~/data'

const colorMode = useColorMode()
const { y } = useWindowScroll()

const scrolled = computed(() => y.value > 20)

function onClick(val: string) {
  colorMode.preference = val
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
        <li class="w-[22px]">
          <ClientOnly>
            <button
              v-if="colorMode.value === 'light'"
              name="light-mode"
              title="Light"
              class="hover:scale-110 transition-all ease-out hover:cursor-pointer w-[22px]"
              @click="onClick('dark')"
            >
              <Icon name="icon-park:moon" size="22" />
            </button>
            <button
              v-if="colorMode.value === 'dark'"
              name="dark-mode"
              title="Dark"
              class="hover:scale-110 transition-all ease-out hover:cursor-pointer w-[22px]"
              @click="onClick('light')"
            >
              <Icon name="noto:sun" size="22" />
            </button>
            <template #fallback>
              <Icon name="svg-spinners:180-ring" size="22" />
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
