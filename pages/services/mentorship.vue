<script lang="ts" setup>
import { mentorshipPage } from '~/data'
import { mentorship as m } from '~/data/mentorship'

useServicePageSchema({
  path: m.path,
  title: mentorshipPage.meta.title,
  description: mentorshipPage.meta.description,
  serviceId: m.id,
  serviceName: 'Personal mentorship to a first IT job offer',
  serviceType: 'Career mentorship and preparation for employment in IT',
  serviceDescription: 'One-on-one mentorship to a first IT job offer: a personal plan, weekly calls, code and resume review, mock interviews, vacancy selection and referrals. Nothing is paid upfront — 20% of gross salary for six months after starting work, and nothing at all without an offer.',
  areaServed: ['Russia'],
  availableLanguage: ['Russian', 'English'],
  audience: 'Career switchers and junior developers looking for their first IT job',
  offerDescription: 'No upfront payment. After starting work: 20% of gross monthly salary for exactly six months. No offer means no payment and no debt.',
  program: {
    name: 'How the mentorship runs, from application to offer',
    description: m.program.lede,
    steps: m.program.steps.map(s => ({ name: s.title, text: s.text })),
  },
  faq: m.faq.items,
  dateModified: `${m.claimsAsOf}-26`,
})

defineOgImage('Blog', {
  headline: mentorshipPage.og.headline,
  title: mentorshipPage.og.title,
  description: mentorshipPage.og.description,
  link: mentorshipPage.og.link,
})
</script>

<template>
  <div class="text-slate-600 dark:text-slate-300">
    <div class="container max-w-5xl mx-auto">
      <!-- Hero. Plain on purpose: the gradient h1 and grid/blob backdrop are the
           home hero's signature, and reusing them here would make this page
           compete with the site's identity. -->
      <section class="pt-14 pb-10 px-6">
        <p class="eyebrow mb-2">
          {{ m.hero.eyebrow }}
        </p>
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ m.hero.title }}
        </h1>
        <p class="mt-5 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {{ m.hero.lede }}
        </p>
        <p class="mt-5 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <template v-for="(fact, i) in m.hero.facts" :key="fact">
            <span v-if="i > 0" class="text-accent-500" aria-hidden="true"> · </span>{{ fact }}
          </template>
        </p>

        <div class="mt-7 flex flex-wrap items-center gap-3">
          <a
            :href="m.hero.ctaPrimary.to"
            class="inline-flex items-center gap-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-400 dark:text-slate-950 dark:hover:bg-accent-300 px-5 py-2.5 text-sm font-semibold ring-1 ring-accent-400/30 shadow-sm hover:shadow-md transition-all"
          >
            {{ m.hero.ctaPrimary.label }}
            <Icon name="mdi:arrow-down" class="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            :href="m.hero.ctaSecondary.href"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-all"
          >
            <Icon name="fa:telegram" class="w-4 h-4" aria-hidden="true" />
            {{ m.hero.ctaSecondary.label }}
          </a>
        </div>
      </section>

      <!-- Numbers. No cards, no icons — a row on the page background. The honesty
           caveat sits at the numbers rather than in fine print 2000px lower. -->
      <section class="px-6 pb-14">
        <div class="border-t border-slate-200 dark:border-slate-800 pt-6">
          <dl class="grid grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-6">
            <div v-for="(stat, i) in m.numbers.items" :key="stat.label" v-reveal="(i % 5) * 70">
              <dt class="font-spacemono text-2xl text-accent-600 dark:text-accent-400">
                {{ stat.value }}
              </dt>
              <dd class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {{ stat.label }}
              </dd>
            </div>
          </dl>
          <p class="mt-6 font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
            {{ m.numbers.note }}
          </p>
        </div>
      </section>

      <!-- Fit before program: someone arriving from an engineering blog asks
           "is this about me" before "what's the syllabus". -->
      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.fit.eyebrow" :title="m.fit.title" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-reveal class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ m.fit.yes.title }}
            </p>
            <ul class="mt-4 space-y-3">
              <li v-for="item in m.fit.yes.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <Icon name="mdi:check" class="mt-0.5 w-4 h-4 shrink-0 text-emerald-500" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Slate, not rose: red would frame the reader as a reject. -->
          <div v-reveal="90" class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ m.fit.no.title }}
            </p>
            <ul class="mt-4 space-y-3">
              <li v-for="item in m.fit.no.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                <Icon name="mdi:close" class="mt-0.5 w-4 h-4 shrink-0 text-slate-400" aria-hidden="true" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>

        <p class="mt-6 text-sm text-slate-500 dark:text-slate-400">
          {{ m.fit.closing }}
        </p>
      </section>

      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.author.eyebrow" :title="m.author.title" />

        <div class="max-w-3xl space-y-4">
          <p v-for="para in m.author.paragraphs" :key="para" class="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            {{ para }}
          </p>
        </div>

        <div class="mt-6 flex flex-wrap items-center gap-2">
          <span
            v-for="company in m.author.companies"
            :key="company"
            class="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 font-spacemono text-[11px] text-slate-500 dark:text-slate-400"
          >
            {{ company }}
          </span>
        </div>

        <NuxtLink
          :to="m.author.link.to"
          class="group mt-6 inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
        >
          {{ m.author.link.label }}
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </NuxtLink>
      </section>

      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.program.eyebrow" :title="m.program.title" />
        <p class="-mt-4 mb-8 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ m.program.lede }}
        </p>

        <ol class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
          <li v-for="(step, i) in m.program.steps" :key="step.n" v-reveal="(i % 2) * 70" class="flex gap-4">
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

        <p class="mt-10 font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
          {{ m.program.tracksNote }}
        </p>
      </section>

      <!-- A checklist, not eight cards: this is the format a skeptic uses to
           price the offer mentally. -->
      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.included.eyebrow" :title="m.included.title" />

        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <li v-for="item in m.included.items" :key="item" class="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <Icon name="mdi:check" class="mt-0.5 w-4 h-4 shrink-0 text-accent-500" aria-hidden="true" />
            {{ item }}
          </li>
        </ul>

        <p class="mt-8 font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
          {{ m.included.note }}
        </p>
      </section>

      <!-- The load-bearing block. `1.2×` is the important number: "20% for six
           months" reads as open-ended, "1.2 months of salary in total" is finite
           and comparable to a recruiter fee. -->
      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.terms.eyebrow" :title="m.terms.title" />
        <p class="-mt-4 mb-8 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {{ m.terms.lede }}
        </p>

        <dl class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
          <div v-for="(fact, i) in m.terms.facts" :key="fact.label" v-reveal="(i % 4) * 70">
            <dt class="font-spacemono text-2xl text-accent-600 dark:text-accent-400">
              {{ fact.value }}
            </dt>
            <dd class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {{ fact.label }}
            </dd>
          </div>
        </dl>

        <div class="mt-10 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6">
          <p class="font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {{ m.terms.example.label }}
          </p>
          <p class="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {{ m.terms.example.text }}
          </p>
        </div>

        <dl class="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
          <div v-for="rule in m.terms.rules" :key="rule.q">
            <dt class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {{ rule.q }}
            </dt>
            <dd class="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ rule.a }}
            </dd>
          </div>
        </dl>

        <NuxtLink
          :to="m.terms.fullTerms.to"
          class="group mt-10 inline-flex items-center gap-1.5 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
        >
          {{ m.terms.fullTerms.label }}
          <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </NuxtLink>
      </section>

      <!-- The single mid-page CTA, placed after the terms rather than after the
           program: people convert on the money model, not the syllabus. -->
      <section class="pb-14 px-6">
        <ServiceCtaBlock
          :label="m.cta.label"
          :note="m.cta.note"
          :anchor="m.cta.to"
          :telegram-href="m.cta.telegram.href"
          :telegram-label="m.cta.telegram.label"
          location="mentorship_terms"
        />
      </section>

      <!-- Cases after the terms: proof lands harder once the reader knows the
           incentive. No photos, no pull-quotes — these are anonymised. -->
      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.cases.eyebrow" :title="m.cases.title" />
        <p class="-mt-4 mb-8 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ m.cases.lede }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(item, i) in m.cases.items"
            :key="item.name"
            v-spotlight
            v-reveal="(i % 2) * 90"
            class="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6"
          >
            <p class="font-spacemono text-2xl text-accent-600 dark:text-accent-400">
              {{ item.weeks }}
            </p>
            <p class="mt-3 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ item.name }}
            </p>
            <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.from }} <span class="text-accent-500" aria-hidden="true">→</span> {{ item.to }}
            </p>
            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span class="font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {{ item.track }} · {{ item.market }}
              </span>
              <span class="font-spacemono text-[11px] text-slate-600 dark:text-slate-300">
                {{ item.salaryRange }}
              </span>
            </div>
          </div>
        </div>

        <p class="mt-8 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {{ m.cases.disclaimer }}
        </p>
      </section>

      <section id="apply" class="py-14 px-6 scroll-mt-28">
        <ServiceInquiryForm
          :heading="m.apply.heading"
          :lede="m.apply.lede"
          :facts="m.apply.facts"
          service="mentorship"
          lock-service
          location="mentorship"
        />
      </section>

      <section class="py-14 px-6">
        <UiSectionHeader :eyebrow="m.faq.eyebrow" :title="m.faq.title" />

        <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          <div v-for="item in m.faq.items" :key="item.question">
            <dt class="font-semibold text-slate-900 dark:text-slate-100">
              {{ item.question }}
            </dt>
            <dd class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ item.answer }}
            </dd>
          </div>
        </dl>

        <p class="mt-10 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {{ m.market.note }}
        </p>
      </section>

      <!-- Cross-link to the Russian original. Latin-only text on purpose: the
           self-hosted font subset has no Cyrillic block, so a Russian word here
           would fall back to a system font and show a visible seam. -->
      <section class="pb-14 px-6">
        <div class="rounded-2xl border border-slate-200/80 dark:border-white/10 px-5 py-4">
          <p class="font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {{ m.origin.eyebrow }}
          </p>
          <p class="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {{ m.origin.text }}
          </p>
          <a
            :href="m.origin.link.href"
            hreflang="ru"
            target="_blank"
            rel="noopener noreferrer"
            class="group mt-3 inline-flex items-center gap-1.5 font-spacemono text-[11px] text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
          >
            {{ m.origin.link.label }}
            <Icon name="mdi:open-in-new" class="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>
      </section>

      <!-- Real fine print, honestly formatted: not styled to be overlooked, not
           inflated into a warning box. -->
      <section class="pb-14 px-6">
        <p class="border-t border-slate-200 dark:border-slate-800 pt-6 max-w-3xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {{ m.honestyNote }}
          <NuxtLink :to="m.terms.fullTerms.to" class="underline decoration-slate-400/50 hover:text-accent-600 dark:hover:text-accent-400">
            Full payment terms
          </NuxtLink>.
        </p>
      </section>
    </div>
  </div>
</template>
