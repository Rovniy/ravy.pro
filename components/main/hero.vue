<script setup lang="ts">
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { homePage, socialNetworks } from '~/data'

const { hero } = homePage
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const typedGreeting = ref(hero.greeting)
const typingDone = ref(true)
const roleIndex = ref(0)
const mounted = ref(false)
const tiltEl = ref<HTMLElement | null>(null)

const currentRole = computed(() => hero.roles[roleIndex.value])

onMounted(() => {
  mounted.value = true

  const canTilt = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine)').matches
  if (!prefersReducedMotion.value && canTilt && tiltEl.value) {
    const MAX_DEG = 8
    let mx = 0
    let my = 0
    let rafId = 0

    const apply = () => {
      rafId = 0
      const el = tiltEl.value
      if (!el)
        return
      const r = el.getBoundingClientRect()
      const dx = (mx - (r.left + r.width / 2)) / window.innerWidth
      const dy = (my - (r.top + r.height / 2)) / window.innerHeight
      el.style.transform = `rotateX(${(-dy * MAX_DEG).toFixed(2)}deg) rotateY(${(dx * MAX_DEG).toFixed(2)}deg)`
    }

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      if (!rafId)
        rafId = requestAnimationFrame(apply)
    }

    const reset = () => {
      if (tiltEl.value)
        tiltEl.value.style.transform = ''
    }

    tiltEl.value.style.willChange = 'transform'
    useEventListener(window, 'mousemove', onMove, { passive: true })
    useEventListener(document, 'mouseleave', reset, { passive: true })
  }

  if (prefersReducedMotion.value)
    return

  typedGreeting.value = ''
  typingDone.value = false

  const charDelay = 200
  let i = 0
  const typeInterval = window.setInterval(() => {
    if (i >= hero.greeting.length) {
      window.clearInterval(typeInterval)
      typingDone.value = true
      return
    }
    typedGreeting.value += hero.greeting[i++]
  }, charDelay)

  const startRotateAfter = hero.greeting.length * charDelay + 900
  window.setTimeout(() => {
    window.setInterval(() => {
      roleIndex.value = (roleIndex.value + 1) % hero.roles.length
    }, 2500)
  }, startRotateAfter)
})
</script>

<template>
  <section class="hero-section relative overflow-hidden">
    <div class="hero-bg-grid" aria-hidden="true" />
    <div class="hero-bg-wash" aria-hidden="true" />
    <div class="hero-blob hero-blob-1" aria-hidden="true" />
    <div class="hero-blob hero-blob-2" aria-hidden="true" />
    <div class="hero-blob hero-blob-3" aria-hidden="true" />

    <div class="relative z-10 max-w-6xl mx-auto px-6 lg:px-10 py-20 md:py-28 lg:py-36 min-h-[calc(100vh-var(--header-h))] flex items-center">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
        <div class="lg:col-span-7 hero-text" :class="{ 'is-mounted': mounted }">
          <p class="hero-step delay-0 inline-flex items-center text-base md:text-lg font-medium text-zinc-500 dark:text-zinc-400 tracking-wide mb-4">
            <span>{{ typedGreeting }}</span>
            <span v-if="!typingDone" class="hero-caret ml-0.5" aria-hidden="true">▎</span>
          </p>

          <h1 class="hero-step delay-1 hero-h1 font-bold leading-[1.1] tracking-tight text-6xl md:text-7xl lg:text-8xl mb-6 bg-gradient-to-r from-sky-400 via-violet-500 to-fuchsia-500 bg-clip-text animate-gradient">
            {{ hero.name }}
          </h1>

          <p class="hero-step delay-2 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-xl md:text-2xl text-zinc-700 dark:text-zinc-300 mb-8">
            <span>I'm a</span>
            <Transition name="role" mode="out-in">
              <span
                :key="currentRole"
                class="inline-flex items-center px-4 py-1.5 rounded-full bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400 font-semibold text-lg md:text-xl border border-sky-500/20 dark:border-sky-400/30 backdrop-blur-sm"
              >
                {{ currentRole }}
              </span>
            </Transition>
          </p>

          <p class="hero-step delay-3 max-w-xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10">
            {{ hero.tagline }}
          </p>

          <div class="hero-step delay-4 flex flex-wrap gap-4 mb-10">
            <NuxtLink
              :to="hero.ctaPrimary.href"
              class="cta-primary group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-base bg-gradient-to-r from-sky-500 to-violet-500 shadow-xl shadow-sky-500/30 hover:shadow-2xl hover:shadow-violet-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              {{ hero.ctaPrimary.label }}
              <Icon name="mdi:arrow-right" size="20" aria-hidden="true" class="group-hover:translate-x-1 transition-transform" />
            </NuxtLink>

            <NuxtLink
              :to="hero.ctaSecondary.href"
              class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-base border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/40 backdrop-blur-sm transition-colors duration-300"
            >
              {{ hero.ctaSecondary.label }}
            </NuxtLink>
          </div>

          <div class="hero-step delay-5 flex flex-wrap items-center gap-5">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20">
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
                class="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-sky-500/10 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                <Icon :name="item.icon" size="15" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="aspect-square lg:col-span-5 hero-creature-wrap hidden md:flex justify-center items-center relative h-[312px] lg:h-[312px] xl:h-[512px]">
          <div ref="tiltEl" class="hero-tilt">
            <NuxtImg
              src="/photos/a_rovnyi_lumy.webp"
              alt="Magic creation"
              height="512"
              width="512"
              class="rounded-2xl"
              sizes="(max-width: 640px) 312px, (max-width: 1024px) 312px, 512px"
              densities="x1 x2"
              loading="lazy"
              fetchpriority="high"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-section {
  position: relative;
  isolation: isolate;
  background: radial-gradient(ellipse at top left, rgba(56, 189, 248, 0.08), transparent 50%),
              radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.10), transparent 55%);
}

.hero-creature-wrap {
  perspective: 1000px;
}

.hero-tilt {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform-style: preserve-3d;
  transition: transform 0.18s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .hero-tilt { transition: none; }
}

.hero-bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
  pointer-events: none;
  z-index: 0;
}

:global(.dark) .hero-bg-grid {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.12) 1px, transparent 1px);
}

.hero-bg-wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0%, transparent 60%, rgba(15, 23, 42, 0) 100%);
  pointer-events: none;
  z-index: 1;
}

.hero-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(60px);
  pointer-events: none;
  will-change: transform, opacity;
  z-index: 0;
}

.hero-blob-1 {
  width: 520px;
  height: 520px;
  top: -120px;
  left: -120px;
  background: radial-gradient(circle, var(--color-sky-400), transparent 70%);
  opacity: 0.35;
  animation: float-blob 14s ease-in-out infinite;
}

.hero-blob-2 {
  width: 460px;
  height: 460px;
  bottom: -140px;
  right: -100px;
  background: radial-gradient(circle, var(--color-violet-500), transparent 70%);
  opacity: 0.32;
  animation: float-blob 18s ease-in-out infinite reverse;
}

/* Third blob removed: 90px filter blur on a third 360px element is the
   single most expensive paint cost in this section on mobile devices. */
.hero-blob-3 {
  display: none;
}

@media (max-width: 768px) {
  .hero-blob {
    animation: none;
    filter: blur(40px);
  }
  .hero-blob-1 { width: 320px; height: 320px; }
  .hero-blob-2 { width: 280px; height: 280px; }
}

.creature-glow {
  position: absolute;
  inset: -40px;
  background: radial-gradient(circle at center, rgba(168, 85, 247, 0.25), transparent 60%);
  filter: blur(40px);
  z-index: 0;
}

.hero-creature {
  width: 280px !important;
  height: 280px !important;
}

@media (min-width: 1024px) {
  .hero-creature {
    width: 360px !important;
    height: 360px !important;
  }
}

/* SSR default: visible. The LCP element (the gradient H1) must paint with
   the initial HTML — gating it on hydration adds 1-3s to LCP on mobile. */
.hero-step {
  opacity: 1;
  transform: none;
}

/* Animate IN only after JS hydrates. One-shot keyframe from a transient
   state to the same steady state, so the stagger effect remains intact. */
.is-mounted .hero-step {
  animation: hero-in 0.7s ease both;
}
.is-mounted .hero-step.delay-0 { animation-delay: 0ms; }
.is-mounted .hero-step.delay-1 { animation-delay: 140ms; }
.is-mounted .hero-step.delay-2 { animation-delay: 280ms; }
.is-mounted .hero-step.delay-3 { animation-delay: 420ms; }
.is-mounted .hero-step.delay-4 { animation-delay: 560ms; }
.is-mounted .hero-step.delay-5 { animation-delay: 700ms; }

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

.hero-caret {
  display: inline-block;
  color: var(--color-sky-400);
  animation: caret-blink 1s steps(1) infinite;
}

@keyframes caret-blink {
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 10s ease infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .animate-gradient { animation: none; }
  .hero-caret { animation: none; opacity: 1; }
  .hero-blob { animation: none; }
}

@media (max-width: 768px) {
  .animate-gradient { animation: none; }
  .creature-glow { display: none; }
}

.role-enter-active,
.role-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.role-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.role-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes float-blob {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33%      { transform: translate(40px, -30px) scale(1.08); }
  66%      { transform: translate(-30px, 30px) scale(0.94); }
}
</style>
