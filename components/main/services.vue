<script setup lang="ts">
import { OFFERINGS } from '~/data/offerings'

// The primary commercial block of the home page. Unlike every other section it
// breaks out of the container as a full-bleed band with its own tinted ground —
// the hero is the only other element on the site that does this, which is
// precisely the signal: this is top-level content, not one more list.
//
// It borrows the hero's visual language on purpose (accent radial wash, faint
// engineering grid, gradient heading) so it reads as a first-class part of the
// page rather than a promo box bolted on. Intensity is dialled below the hero's
// so the two don't compete, and the glow here is static — the hero already pays
// for two animated ones.
//
// Theming is done with Tailwind `dark:` utilities rather than `:global(.dark)`
// scoped CSS: the utility path is what the rest of the site uses and it is the
// one that reliably wins. Only the grid pattern and the gradient-text clip live
// in <style>, and both are written to be theme-independent.
const { trackCta } = useAnalytics()

function linkFor(offering: typeof OFFERINGS[number]) {
  return offering.cta.kind === 'page'
    ? offering.cta.path
    : { path: '/services', query: { service: offering.id }, hash: '#inquiry' }
}
</script>

<template>
  <section
    class="relative isolate overflow-hidden border-y border-slate-300/40 dark:border-white/10
           bg-[radial-gradient(ellipse_at_12%_0%,rgba(45,212,191,0.11),transparent_58%),radial-gradient(ellipse_at_88%_100%,rgba(52,211,153,0.10),transparent_58%)]
           dark:bg-[radial-gradient(ellipse_at_12%_0%,rgba(45,212,191,0.15),transparent_58%),radial-gradient(ellipse_at_88%_100%,rgba(52,211,153,0.12),transparent_58%)]"
  >
    <div class="services-grid" aria-hidden="true" />
    <div
      class="pointer-events-none absolute -top-56 -right-40 w-[34rem] h-[34rem] rounded-full blur-[90px] z-0
             bg-[radial-gradient(circle,rgba(45,212,191,0.14),transparent_66%)]
             dark:bg-[radial-gradient(circle,rgba(45,212,191,0.20),transparent_66%)]"
      aria-hidden="true"
    />

    <div class="relative container max-w-5xl mx-auto px-6 py-12 sm:py-20">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
        <div class="max-w-2xl">
          <p class="eyebrow mb-2.5">
            Working together
          </p>
          <h2 class="gradient-clip text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 bg-gradient-to-r from-accent-600 to-emerald-600 dark:from-accent-400 dark:to-emerald-400">
            Services
          </h2>
          <p class="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Work with me directly — mentorship, consulting, or part-time engineering help for your team. Each one starts with a conversation rather than a checkout.
          </p>
        </div>

        <NuxtLink
          to="/services"
          class="group shrink-0 self-start lg:self-auto inline-flex items-center gap-2 rounded-full bg-accent-600 hover:bg-accent-700 dark:bg-accent-400 dark:hover:bg-accent-300 text-white dark:text-slate-950 px-6 py-3 text-sm font-semibold ring-1 ring-accent-400/30 shadow-lg shadow-accent-500/20 hover:shadow-xl hover:shadow-accent-500/25 transition-all"
          @click="trackCta('services-index', 'home_services')"
        >
          All services
          <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </NuxtLink>
      </div>

      <!-- 2×2, not 3-across: with four offerings a three-column grid leaves a
           lone card on the second row. -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <NuxtLink
          v-for="(offering, i) in OFFERINGS"
          :key="offering.id"
          v-reveal="i * 90"
          :to="linkFor(offering)"
          class="group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1
                 border border-accent-500/25 dark:border-accent-400/20
                 bg-white/75 dark:bg-slate-900/70 backdrop-blur-sm
                 shadow-lg shadow-teal-900/5 dark:shadow-black/30
                 hover:border-accent-500/60 dark:hover:border-accent-400/50
                 hover:shadow-xl hover:shadow-teal-900/15 dark:hover:shadow-black/40"
          @click="trackCta(offering.id, 'home_services')"
        >
          <div class="flex items-start justify-between gap-3">
            <!-- Filled gradient badge, not the pale chip the Tools grid uses —
                 this is where the block's colour lives. -->
            <span class="grid place-items-center w-12 h-12 rounded-2xl text-white bg-gradient-to-br from-accent-500 to-emerald-500 shadow-lg shadow-accent-500/30 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
              <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
            </span>
            <span class="mt-1 text-right font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {{ offering.tag }}
            </span>
          </div>

          <p class="mt-5 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors">
            {{ offering.name }}
          </p>
          <p class="mt-2 grow text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {{ offering.tagline }}
          </p>

          <div class="mt-5 pt-4 border-t border-accent-500/15 dark:border-accent-400/15">
            <p class="font-spacemono text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              {{ offering.meta }}
            </p>
            <span class="mt-3 inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-accent-700 dark:text-accent-300">
              {{ offering.action }}
              <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Same engineering grid as the hero, one step fainter. Slate at a low alpha
   reads correctly on both themes, so this needs no dark variant. */
.services-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 40%, black 20%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* Gradient text: Lighthouse reads computed `color` (transparent under
   bg-clip-text) and flags contrast, so the readable colour comes from the
   `text-slate-*` utilities on the element and bg-clip wins visually here.
   Theme-independent — no dark variant needed. */
.gradient-clip {
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
