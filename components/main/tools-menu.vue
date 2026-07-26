<script setup lang="ts">
import { onClickOutside, useEventListener } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAccess } from '~/composables/useAccess'
import { publicServices } from '~/data'

// Access-granted tools live in this same menu rather than a separate nav item:
// there is normally at most one of them, and a whole top-level dropdown for a
// single private link was more chrome than it earned. They render below a
// divider with a "private" chip so it stays obvious they aren't public.
const { accessibleServices } = useAccess()

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

const sortedList = computed(() => [...publicServices].sort((a, b) => a.name.localeCompare(b.name)))
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="services-trigger inline-flex items-center gap-1 rounded-sm hover:text-accent-600 dark:hover:text-accent-400 hover:cursor-pointer"
      :aria-expanded="isOpen"
      aria-controls="tools-menu-list"
      @click="toggle"
    >
      Tools
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
      <!--
        Deliberately NOT role="menu": ARIA menus promise arrow-key roving
        focus, which a plain list of links doesn't (and needn't) implement.
        A disclosure pattern (aria-expanded + regular links) is correct here.
      -->
      <div
        v-if="isOpen"
        id="tools-menu-list"
        class="absolute right-0 top-full mt-2 w-70 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shadow-lg py-1 z-20"
      >
        <NuxtLink
          v-for="item in sortedList"
          :key="item.path"
          :to="item.path"
          class="services-item px-4 py-2 text-sm sm:text-base font-medium hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-accent-600 dark:hover:text-accent-400 flex items-center gap-3"
        >
          <Icon :name="item.icon" size="1.4em" aria-hidden="true" class="hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-accent-600 dark:hover:text-accent-400" />
          {{ item.name }}
        </NuxtLink>

        <!-- Resolved client-side from the user's access grants, so only the
             people who have them ever see these rows. -->
        <ClientOnly>
          <NuxtLink
            v-for="(item, i) in accessibleServices"
            :key="item.path"
            :to="item.path"
            class="services-item px-4 py-2 text-sm sm:text-base font-medium hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-accent-600 dark:hover:text-accent-400 flex items-center gap-3"
            :class="i === 0 ? 'mt-1 pt-2.5 border-t border-slate-200 dark:border-slate-800' : ''"
          >
            <Icon :name="item.icon" size="1.4em" aria-hidden="true" />
            <span class="flex-1">{{ item.name }}</span>
            <span class="font-spacemono text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              private
            </span>
          </NuxtLink>
        </ClientOnly>
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
  @apply outline-2 outline-offset-4 outline-accent-500;
}

.services-item:focus {
  @apply outline-none;
}

.services-item:focus-visible {
  @apply bg-slate-200 dark:bg-slate-800 text-accent-600 dark:text-accent-400;
}

.services-item.router-link-active {
  @apply text-accent-600 dark:text-accent-400 bg-slate-100 dark:bg-slate-900;
}
</style>
