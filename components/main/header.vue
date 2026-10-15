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
    class="fixed inset-x-0 top-0 z-30 bg-bg border-b transition-colors duration-300"
    :class="scrolled ? 'border-line-strong' : 'border-line'"
  >
    <LayoutContainer class="flex h-[var(--header-h)] justify-between items-center">
      <ul class="flex items-baseline space-x-5">
        <li class="font-display font-extrabold italic uppercase text-2xl lg:text-3xl leading-none">
          <NuxtLink to="/" class="nav-link nav-brand inline-flex items-center gap-2.5 text-fg" @click="navClick('home')">
            <span class="w-3 h-5 bg-accent -skew-x-10" aria-hidden="true" />
            {{ navbarData.homeTitle }}
          </NuxtLink>
        </li>
      </ul>

      <ul class="flex items-center space-x-3 lg:space-x-6 font-display font-bold uppercase tracking-[0.06em] text-base lg:text-lg">
        <li class="hidden lg:block">
          <NuxtLink to="/blogs" class="nav-link hover:text-fg" @click="navClick('blogs')">
            Blogs
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <NuxtLink to="/til" class="nav-link hover:text-fg" title="Today I Learned: short notes" @click="navClick('til')">
            TIL
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <MainToolsMenu />
        </li>
        <li class="hidden lg:block">
          <NuxtLink to="/projects" class="nav-link hover:text-fg" @click="navClick('projects')">
            Projects
          </NuxtLink>
        </li>
        <li class="hidden lg:block">
          <NuxtLink to="/services" class="nav-link hover:text-fg" @click="navClick('services')">
            Services
          </NuxtLink>
        </li>
        <li class="hidden lg:block" title="About Me">
          <NuxtLink to="/about" aria-label="About me" class="nav-link hover:text-fg" @click="navClick('about')">
            About
          </NuxtLink>
        </li>
        <li class="hidden md:block">
          <CommandTrigger variant="header" />
        </li>
        <li class="md:hidden">
          <CommandTrigger variant="icon" />
        </li>
        <!-- Theme switching lives in the floating control at the bottom-left
             (layouts/default.vue) so the header carries navigation only. -->
        <li class="flex items-center mr-0">
          <MainAuthButton />
        </li>
        <li class="lg:hidden">
          <button
            ref="mobileToggleRef"
            type="button"
            class="inline-flex items-center justify-center w-11 h-11 -my-1 -mr-3 hover:text-fg hover:cursor-pointer"
            :aria-expanded="isMobileOpen"
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            @click="toggleMobile"
          >
            <Icon :name="isMobileOpen ? 'mdi:close' : 'mdi:menu'" size="26" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </LayoutContainer>

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
        class="lg:hidden absolute inset-x-0 top-full overflow-hidden bg-panel border-b border-line-strong"
        aria-label="Mobile navigation"
        @keydown="onMobileNavKeydown"
      >
        <ul class="px-6 py-3 flex flex-col font-display font-bold uppercase tracking-[0.06em] text-lg max-h-[calc(100dvh-var(--header-h))] overflow-y-auto overscroll-contain">
          <li>
            <NuxtLink to="/blogs" class="nav-link block py-3 hover:text-fg" @click="navClick('blogs', 'mobile')">
              Blogs
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/til" class="nav-link block py-3 hover:text-fg" @click="navClick('til', 'mobile')">
              TIL notes
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/projects" class="nav-link block py-3 hover:text-fg" @click="navClick('projects', 'mobile')">
              Projects
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/services" class="nav-link block py-3 hover:text-fg" @click="navClick('services', 'mobile')">
              Services
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/about" aria-label="About me" class="nav-link block py-3 hover:text-fg" @click="navClick('about', 'mobile')">
              About me
            </NuxtLink>
          </li>
          <li class="mt-2 pt-3 border-t border-line font-spacemono font-normal text-micro tracking-[0.12em] text-fg-subtle">
            Tools
          </li>
          <li v-for="item in publicServices" :key="item.path">
            <NuxtLink :to="item.path" class="nav-link block py-3 hover:text-fg" @click="navClick(item.path, 'mobile')">
              {{ item.name }}
            </NuxtLink>
          </li>
          <!-- Access-granted tools sit in the same Tools group, resolved
               client-side so only the people who have them see the rows.
               Access management itself lives on /account (Access tab). -->
          <ClientOnly>
            <li v-for="item in accessibleServices" :key="item.path">
              <NuxtLink :to="item.path" class="nav-link flex items-center gap-2 py-3 hover:text-fg" @click="navClick(item.path, 'mobile')">
                {{ item.name }}
                <span class="font-spacemono text-micro uppercase tracking-wider text-fg-subtle">private</span>
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
  position: relative;
  color: var(--ui-fg-muted);
  transition: color 0.15s;
}

.nav-link:focus {
  @apply outline-none;
}

.nav-link:focus-visible {
  @apply outline-2 outline-offset-4 outline-accent-500;
}

.nav-link.router-link-active {
  color: var(--ui-fg);
}

/* Active/hover marker: a slanted accent bar that wipes in from the left.
   The brand link opts out (a logo doesn't carry nav state). */
.nav-link:not(.nav-brand)::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -6px;
  height: 3px;
  width: 100%;
  background: var(--ui-accent);
  transform: skewX(var(--skew)) scaleX(0);
  transform-origin: left;
  transition: transform 0.25s var(--ease-expo);
}
@media (hover: hover) {
  .nav-link:not(.nav-brand):hover::after {
    transform: skewX(var(--skew)) scaleX(1);
  }
}
.nav-link:not(.nav-brand).router-link-exact-active::after {
  transform: skewX(var(--skew)) scaleX(1);
}

/* In the mobile sheet links are full-width block rows: a full-width bar reads
   as a divider, so shrink the marker to a short tick instead. */
#mobile-nav .nav-link::after {
  width: 2.25rem;
  bottom: 0.45rem;
}

.nav-brand {
  color: var(--ui-fg);
}
</style>
