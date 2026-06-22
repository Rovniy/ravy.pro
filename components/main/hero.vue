<script setup lang="ts">
import { homePage, socialNetworks } from '~/data'

const { hero } = homePage

// One orchestrated moment: the staggered entrance, played once after hydration.
// SSR renders the content already visible (hero-step defaults to opacity 1), so
// the LCP H1 paints with the initial HTML. Reduced-motion is handled in CSS.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <section class="hero-section relative overflow-hidden">
    <div class="hero-bg-grid" aria-hidden="true" />

    <div class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-20 md:py-28 lg:py-32 min-h-[calc(100vh-var(--header-h))] flex items-center">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        <div class="lg:col-span-7 hero-text" :class="{ 'is-mounted': mounted }">
          <p class="hero-step delay-0 eyebrow mb-5">
            {{ hero.greeting }}
          </p>

          <h1 class="hero-step delay-1 hero-h1 font-bold leading-[1.05] tracking-tight text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-sky-400 to-violet-500 bg-clip-text">
            {{ hero.name }}
          </h1>

          <p class="hero-step delay-2 font-spacemono text-sm md:text-base mb-8 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <template v-for="(role, i) in hero.roles" :key="role">
              <span class="text-slate-700 dark:text-slate-300">{{ role }}</span>
              <span v-if="i < hero.roles.length - 1" class="text-sky-500 dark:text-sky-400" aria-hidden="true">·</span>
            </template>
          </p>

          <p class="hero-step delay-3 max-w-xl text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
            {{ hero.tagline }}
          </p>

          <div class="hero-step delay-4 flex flex-wrap gap-4 mb-10">
            <NuxtLink
              :to="hero.ctaPrimary.href"
              class="cta-primary group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-base bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              {{ hero.ctaPrimary.label }}
              <Icon name="mdi:arrow-right" size="20" aria-hidden="true" class="group-hover:translate-x-1 transition-transform" />
            </NuxtLink>

            <NuxtLink
              :to="hero.ctaSecondary.href"
              class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/40 transition-colors duration-300"
            >
              {{ hero.ctaSecondary.label }}
            </NuxtLink>
          </div>

          <div class="hero-step delay-5 flex flex-wrap items-center gap-5">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-spacemono uppercase tracking-wider border border-emerald-500/20">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {{ hero.status }}
            </span>

            <div class="flex flex-wrap gap-2">
              <NuxtLink
                v-for="item in socialNetworks"
                :key="item.name"
                :to="item.href"
                target="_blank"
                :aria-label="item.name"
                class="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <Icon :name="item.icon" size="15" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 hidden md:flex justify-center items-center relative h-[312px] lg:h-[312px] xl:h-[512px]">
          <NuxtImg
            src="/photos/a_rovnyi_lumy.webp"
            alt="Andrei Rovnyi"
            height="512"
            width="512"
            class="rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-xl shadow-slate-900/5 dark:shadow-black/30"
            sizes="(max-width: 640px) 312px, (max-width: 1024px) 312px, 512px"
            densities="x1 x2"
            loading="lazy"
            fetchpriority="high"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  isolation: isolate;
  background: radial-gradient(ellipse at top left, rgba(56, 189, 248, 0.07), transparent 50%),
              radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.07), transparent 55%);
}

/* Faint engineering grid — the only ambient backdrop. */
.hero-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.07) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

:global(.dark) .hero-bg-grid {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
}

/* SSR default: visible. The LCP element (the H1) must paint with the initial
   HTML — gating it on hydration adds 1-3s to LCP on mobile. */
.hero-step {
  opacity: 1;
  transform: none;
}

/* Animate IN once after JS hydrates: a transient state back to the steady
   state, so the staggered reveal plays but the resting layout is unchanged. */
.is-mounted .hero-step {
  animation: hero-in 0.7s ease both;
}
.is-mounted .hero-step.delay-0 { animation-delay: 0ms; }
.is-mounted .hero-step.delay-1 { animation-delay: 120ms; }
.is-mounted .hero-step.delay-2 { animation-delay: 240ms; }
.is-mounted .hero-step.delay-3 { animation-delay: 360ms; }
.is-mounted .hero-step.delay-4 { animation-delay: 480ms; }
.is-mounted .hero-step.delay-5 { animation-delay: 600ms; }

@keyframes hero-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .is-mounted .hero-step { animation: none; }
}

/* Gradient text fallback: Lighthouse reads computed `color` (which is
   `transparent` for bg-clip-text gradients) and flags contrast. Set a
   high-contrast color first; bg-clip wins visually via -webkit-text-fill. */
.hero-h1 {
  color: #0f172a;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
:global(.dark) .hero-h1 {
  color: #f1f5f9;
}
</style>
