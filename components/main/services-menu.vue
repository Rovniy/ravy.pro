<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAccess } from '~/composables/useAccess'

const { accessibleServices, isAdmin } = useAccess()

const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const route = useRoute()

onClickOutside(menuRef, () => {
  isOpen.value = false
})

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape')
    isOpen.value = false
})

watch(() => route.fullPath, () => {
  isOpen.value = false
})

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="services-trigger inline-flex items-center gap-1 rounded-sm hover:text-sky-600 dark:hover:text-sky-400 hover:cursor-pointer"
      :aria-expanded="isOpen"
      aria-haspopup="menu"
      @click="toggle"
    >
      Services
      <Icon name="mdi:chevron-down" size="18" aria-hidden="true" :class="isOpen ? 'rotate-180' : ''" class="transition-transform" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen"
        role="menu"
        class="absolute right-0 top-full mt-2 w-60 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-lg py-1 z-20"
      >
        <NuxtLink
          v-for="item in accessibleServices"
          :key="item.path"
          :to="item.path"
          role="menuitem"
          class="services-item flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
        >
          <Icon :name="item.icon" size="18" aria-hidden="true" />
          {{ item.name }}
        </NuxtLink>
        <NuxtLink
          v-if="isAdmin"
          to="/account?tab=access"
          role="menuitem"
          class="services-item flex items-center gap-2 mt-1 pt-2 border-t border-slate-200 dark:border-slate-800 px-4 py-2 text-sm sm:text-base font-medium hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-sky-600 dark:hover:text-sky-400"
        >
          <Icon name="mdi:account-key-outline" size="18" aria-hidden="true" />
          Manage access
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<style>
@reference "../../assets/css/tailwind.css";

.services-trigger:focus {
  @apply outline-none;
}

.services-trigger:focus-visible {
  @apply outline-2 outline-offset-4 outline-sky-500;
}

.services-item:focus {
  @apply outline-none;
}

.services-item:focus-visible {
  @apply bg-slate-200 dark:bg-slate-800 text-sky-600 dark:text-sky-400;
}

.services-item.router-link-active {
  @apply text-sky-600 dark:text-sky-400 bg-slate-100 dark:bg-slate-900;
}
</style>
