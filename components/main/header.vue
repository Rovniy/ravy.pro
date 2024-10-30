<script setup lang="ts">
import { navbarData } from '~/data'

const colorMode = useColorMode()

function onClick(val: string) {
  colorMode.preference = val
}
</script>

<template>
  <header class="fixed w-full bg-[#F1F2F4] dark:bg-slate-950 z-10">
    <div class="py-5 border-b dark:border-gray-800  font-semibold">
      <div class="flex px-6 container max-w-5xl justify-between mx-auto items-baseline ">
        <ul class="flex items-baseline space-x-5">
          <li class="text-base sm:text-2xl font-bold">
            <NuxtLink to="/">
              {{ navbarData.homeTitle }}
            </NuxtLink>
          </li>
        </ul>

        <ul class="flex items-center space-x-3 sm:space-x-6 text-sm sm:text-lg">
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
                <!-- this will be rendered on server side -->
                <Icon name="svg-spinners:180-ring" size="22" />
              </template>
            </ClientOnly>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style>
.router-link-active .router-link-exact-active  {
  @apply underline
}
</style>
