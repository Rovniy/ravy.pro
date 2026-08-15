<script lang="ts" setup>
import { fractionalCtoPage } from '~/data'
import { fractionalCto as c } from '~/data/fractional-cto'

useServicePageSchema({
  path: c.path,
  title: fractionalCtoPage.meta.title,
  description: fractionalCtoPage.meta.description,
  serviceId: c.id,
  serviceName: 'Fractional CTO / engineering leadership for game studios and high-load products',
  serviceType: 'Fractional engineering leadership and technical management',
  serviceDescription: 'Part-time engineering leadership for game studios and high-load web products: a fixed-scope engineering audit, then an advisory or standard retainer. Architecture, delivery process, and team management — not a coding contractor.',
  availableLanguage: ['English', 'Russian'],
  audience: 'Game studios of 5–40 people and teams running high-load or real-time products',
  // No areaServed on purpose: schema.org cannot express "outside the UAE", and
  // a country list would misstate the offer. The exclusion lives in the copy.
  offers: c.packages.items.map(p => ({
    name: p.name,
    price: p.price,
    description: p.priceLine,
  })),
  program: {
    name: 'How a fractional CTO engagement starts',
    steps: c.steps.items.map(s => ({ name: s.title, text: s.text })),
  },
  faq: c.faq.items,
})

defineOgImage('Blog', {
  headline: fractionalCtoPage.og.headline,
  title: fractionalCtoPage.og.title,
  description: fractionalCtoPage.og.description,
  link: fractionalCtoPage.og.link,
})

const { trackCta } = useAnalytics()
</script>

<template>
  <div class="text-slate-600 dark:text-slate-300">
    <div class="container max-w-5xl mx-auto">
      <!-- Hero. Plain on purpose, same reasoning as the mentorship page.
           Section rhythm matches it too: bottom padding only (pb-16), so the
           gap between any two sections is a constant 64px. -->
      <section class="pt-14 pb-10 px-6">
        <p class="eyebrow mb-2">
          {{ c.hero.eyebrow }}
        </p>
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ c.hero.title }}
        </h1>
        <p class="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {{ c.hero.lede }}
        </p>

        <div class="mt-7 flex flex-wrap items-center gap-3">
          <a
            :href="c.hero.ctaPrimary.to"
            class="inline-flex items-center gap-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300 px-5 py-2.5 text-sm font-semibold ring-1 ring-accent-400/30 shadow-sm hover:shadow-md transition-all"
            @click="trackCta('fractional-cto-fit-call', 'fractional_cto_hero')"
          >
            {{ c.hero.ctaPrimary.label }}
            <Icon name="mdi:arrow-down" class="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            :href="c.hero.ctaSecondary.to"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
            @click="trackCta('fractional-cto-audit', 'fractional_cto_hero')"
          >
            {{ c.hero.ctaSecondary.label }}
            <Icon name="mdi:arrow-down" class="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <!-- Fact strip: four verifiable numbers instead of adjectives. -->
      <section class="px-6 pb-16">
        <div class="border-t border-slate-200 dark:border-slate-800 pt-6">
          <p class="font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <template v-for="(fact, i) in c.facts" :key="fact">
              <span v-if="i > 0" class="text-accent-500" aria-hidden="true"> · </span>{{ fact }}
            </template>
          </p>
        </div>
      </section>

      <!-- The filter that saves everyone's hours. -->
      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.fit.eyebrow" :title="c.fit.title" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-reveal class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ c.fit.yes.title }}
            </p>
            <ul class="mt-4 space-y-3">
              <li v-for="item in c.fit.yes.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <Icon name="mdi:check" class="mt-0.5 w-4 h-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Slate, not rose — same reasoning as the mentorship page. -->
          <div v-reveal="90" class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ c.fit.no.title }}
            </p>
            <ul class="mt-4 space-y-3">
              <li v-for="item in c.fit.no.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <Icon name="mdi:close" class="mt-0.5 w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.steps.eyebrow" :title="c.steps.title" />

        <ol class="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-8">
          <li v-for="(step, i) in c.steps.items" :key="step.n" v-reveal="(i % 3) * 70" class="flex gap-4">
            <span class="shrink-0 font-spacemono text-sm text-accent-500 pt-0.5" aria-hidden="true">
              {{ step.n }}
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <p class="font-semibold text-slate-900 dark:text-slate-100">
                  {{ step.title }}
                </p>
                <span class="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ step.duration }}
                </span>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {{ step.text }}
              </p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Prices on the page, not "on request" — the price is part of the filter. -->
      <section id="packages" class="pb-16 px-6 scroll-mt-28">
        <UiSectionHeader :eyebrow="c.packages.eyebrow" :title="c.packages.title" />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <div
            v-for="(pkg, i) in c.packages.items"
            :key="pkg.id"
            v-spotlight
            v-reveal="(i % 3) * 90"
            class="flex flex-col rounded-2xl border bg-white dark:bg-slate-900 p-6"
            :class="pkg.emphasized
              ? 'border-accent-400/60 dark:border-accent-500/50 ring-1 ring-accent-400/30 shadow-md'
              : 'border-slate-200/80 dark:border-white/10'"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {{ pkg.name }}
              </p>
              <span v-if="pkg.emphasized" class="rounded-full bg-accent-500/10 text-accent-600 dark:text-accent-400 px-2.5 py-0.5 font-spacemono text-[10px] uppercase tracking-wider">
                Default
              </span>
            </div>
            <p class="mt-2 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
              {{ pkg.priceLine }}
            </p>
            <p class="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ pkg.lede }}
            </p>
            <ul class="mt-4 space-y-2.5 flex-1">
              <li v-for="item in pkg.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <Icon name="mdi:check" class="mt-0.5 w-4 h-4 shrink-0 text-accent-500" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
            <a
              href="#fit-call"
              class="mt-6 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all"
              :class="pkg.emphasized
                ? 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300 ring-1 ring-accent-400/30 shadow-sm hover:shadow-md'
                : 'border border-slate-300 dark:border-slate-700 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400'"
              @click="trackCta(`fractional-cto-${pkg.id}`, 'fractional_cto_packages')"
            >
              {{ pkg.cta }}
              <Icon name="mdi:arrow-down" class="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <p class="mt-8 max-w-3xl font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
          {{ c.packages.footnote }}
        </p>
      </section>

      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.deliverables.eyebrow" :title="c.deliverables.title" />
        <p class="-mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ c.deliverables.lede }}
        </p>

        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
          <div v-for="item in c.deliverables.items" :key="item.name">
            <dt class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ item.name }}
            </dt>
            <dd class="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.text }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- Track record: only the facts already published on /about. No
           testimonials, no logos, no ratings — there are none yet, and an empty
           section is more honest than a fabricated one. -->
      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.track.eyebrow" :title="c.track.title" />

        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-w-4xl">
          <li v-for="item in c.track.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <Icon name="mdi:check" class="mt-0.5 w-4 h-4 shrink-0 text-accent-500" aria-hidden="true" />
            {{ item }}
          </li>
        </ul>

        <p class="mt-6 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ c.track.note }}
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <span
            v-for="item in c.track.stack"
            :key="item"
            class="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 font-spacemono text-[11px] text-slate-500 dark:text-slate-400"
          >
            {{ item }}
          </span>
        </div>

        <NuxtLink
          :to="c.track.link.to"
          class="group mt-6 inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
        >
          {{ c.track.link.label }}
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </NuxtLink>
      </section>

      <!-- The constraint stated as a fact, not hidden: it reads as
           professionalism on the page and would surface on the first call anyway. -->
      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.availability.eyebrow" :title="c.availability.title" />
        <div class="max-w-3xl space-y-4">
          <p v-for="para in c.availability.paragraphs" :key="para" class="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {{ para }}
          </p>
        </div>
      </section>

      <section id="fit-call" class="pb-16 px-6 scroll-mt-28">
        <ServiceInquiryForm
          :heading="c.apply.heading"
          :lede="c.apply.lede"
          :facts="c.apply.facts"
          service="fractional-cto"
          lock-service
          location="fractional_cto"
        />
        <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {{ c.finalCta.note }}
        </p>
      </section>

      <section class="pb-16 px-6">
        <UiSectionHeader :eyebrow="c.faq.eyebrow" :title="c.faq.title" />

        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div v-for="item in c.faq.items" :key="item.question">
            <dt class="font-semibold text-slate-900 dark:text-slate-100">
              {{ item.question }}
            </dt>
            <dd class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.answer }}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>
