<script setup lang="ts">
import { homePage, socialNetworks } from '~/data'

const { hero } = homePage

// The name is set on two lines, the surname in the accent: split on the last
// space so a middle name would stay with the first line.
const nameLines = computed(() => {
  const at = hero.name.lastIndexOf(' ')
  return at === -1 ? [hero.name, ''] : [hero.name.slice(0, at), hero.name.slice(at + 1)]
})

// One orchestrated moment: the staggered entrance, played once after hydration.
// SSR renders the content already visible (hero-step defaults to opacity 1), so
// the LCP H1 paints with the initial HTML. Reduced-motion is handled in CSS.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const { trackCta } = useAnalytics()
</script>

<template>
  <!-- A character-select screen: name, class tabs and record on the left, the
       portrait in a cut frame on the right. No glow, no blobs: the structure
       carries it. -->
  <section class="relative border-b border-line" :class="{ 'is-mounted': mounted }">
    <LayoutContainer class="py-14 md:py-20 lg:py-24">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-stretch">
        <div class="lg:col-span-7 min-w-0">
          <p class="hero-step delay-0 mb-5 inline-flex items-center gap-2.5 font-spacemono text-xs uppercase tracking-[0.12em] text-ok">
            <span class="w-2 h-2 bg-ok" aria-hidden="true" />
            {{ hero.status }}
          </p>

          <h1 class="hero-step delay-1 mb-7 font-display italic font-extrabold uppercase text-display text-fg">
            {{ nameLines[0] }}
            <span v-if="nameLines[1]" class="block text-accent-ink">{{ nameLines[1] }}</span>
          </h1>

          <ul class="hero-step delay-2 mb-7 flex flex-wrap gap-2" aria-label="Roles">
            <li
              v-for="(role, i) in hero.roles"
              :key="role"
              class="skew-box px-3.5 py-1.5 font-display font-semibold text-base uppercase tracking-[0.06em] before:border"
              :class="i === 0 ? 'text-fg before:border-accent before:bg-accent/15' : 'text-fg-muted before:border-line-strong'"
            >
              {{ role }}
            </li>
          </ul>

          <p class="hero-step delay-3 max-w-xl mb-8 text-lg md:text-xl leading-relaxed text-fg-muted">
            {{ hero.tagline }}
          </p>

          <div class="hero-step delay-4 mb-8 flex flex-wrap items-center gap-x-5 gap-y-4">
            <UiButton :to="hero.ctaPrimary.href" @click="trackCta('hero_primary', 'hero')">
              {{ hero.ctaPrimary.label }}
              <Icon name="mdi:arrow-right" size="20" aria-hidden="true" />
            </UiButton>
            <UiButton variant="secondary" :to="hero.ctaSecondary.href" @click="trackCta('hero_secondary', 'hero')">
              {{ hero.ctaSecondary.label }}
            </UiButton>
          </div>

          <!-- The whole site behind one field: opens the ⌘K palette, and each
               chip opens it pre-filled. -->
          <CommandTrigger variant="hero" :suggestions="hero.searchSuggestions" class="hero-step delay-4 max-w-xl" />
        </div>

        <div class="hero-step delay-2 lg:col-span-5 hidden md:block">
          <div class="relative h-full min-h-80 max-w-md lg:max-w-none mx-auto">
            <!-- The slanted accent slab sits behind the frame's right half. -->
            <div class="absolute -inset-y-3 right-[12%] w-[38%] bg-accent -skew-x-10" aria-hidden="true" />
            <div class="frame cut relative h-full">
              <div class="frame-inner cut relative overflow-hidden">
                <div class="hazard absolute inset-x-0 top-0 h-2.5 z-10" aria-hidden="true" />
                <NuxtImg
                  src="/photos/a_rovnyi_lumy.webp"
                  alt="Andrei Rovnyi"
                  height="512"
                  width="512"
                  class="w-full h-full object-cover"
                  sizes="sm:312px md:448px lg:512px"
                  densities="x1 x2"
                  loading="eager"
                  fetchpriority="high"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- The record: evidence directly under the ask, read like a stat panel. -->
      <div class="hero-step delay-5 mt-12 grid grid-cols-2 md:grid-cols-4 border-t border-line">
        <p
          v-for="fact in hero.proof"
          :key="fact"
          class="py-4 pr-4 font-spacemono text-xs uppercase tracking-[0.1em] text-fg-muted"
        >
          <span class="block mb-2 w-4 h-0.5 bg-accent" aria-hidden="true" />
          {{ fact }}
        </p>
      </div>

      <div class="hero-step delay-5 mt-4 -ml-3 flex flex-wrap gap-1">
        <NuxtLink
          v-for="item in socialNetworks"
          :key="item.name"
          :to="item.href"
          target="_blank"
          :aria-label="item.name"
          class="w-11 h-11 flex items-center justify-center text-fg-muted hover:text-accent-ink hover:bg-panel-raised transition-colors"
        >
          <Icon :name="item.icon" size="16" aria-hidden="true" />
        </NuxtLink>
      </div>
    </LayoutContainer>
  </section>
</template>

<style scoped>
/* SSR default: visible. The LCP element (the H1) must paint with the initial
   HTML — gating it on hydration adds 1-3s to LCP on mobile. */
.hero-step {
  opacity: 1;
  transform: none;
}

/* After hydration each layer slides in from the left with a hard wipe, a HUD
   loading in rather than a soft fade. */
.is-mounted .hero-step {
  animation: hero-in 0.45s var(--ease-expo) both;
}
.is-mounted .delay-0 { animation-delay: 0ms; }
.is-mounted .delay-1 { animation-delay: 70ms; }
.is-mounted .delay-2 { animation-delay: 140ms; }
.is-mounted .delay-3 { animation-delay: 210ms; }
.is-mounted .delay-4 { animation-delay: 280ms; }
.is-mounted .delay-5 { animation-delay: 350ms; }

@keyframes hero-in {
  from { opacity: 0; transform: translateX(-16px); clip-path: inset(-2rem 100% -2rem -2rem); }
  to   { opacity: 1; transform: none; clip-path: inset(-2rem); }
}

@media (prefers-reduced-motion: reduce) {
  .is-mounted .hero-step { animation: none; }
}
</style>
