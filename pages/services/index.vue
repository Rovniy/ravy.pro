<script lang="ts" setup>
import { servicesPage } from '~/data'
import { OFFERINGS } from '~/data/offerings'

const siteUrl = 'https://ravy.pro'
const title = servicesPage.meta.title
const description = servicesPage.meta.description

useHead({
  title,
  meta: [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: `${siteUrl}/services` },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ],
  link: [
    { rel: 'canonical', href: `${siteUrl}/services` },
  ],
})

useServicesIndexSchema({
  description,
  items: OFFERINGS.map(o => ({
    path: o.cta.kind === 'page' ? o.cta.path : '/services',
    name: o.name,
  })),
})

defineOgImage('Blog', {
  headline: servicesPage.og.headline,
  title: servicesPage.og.title,
  description: servicesPage.og.description,
  link: servicesPage.og.link,
})

const { trackCta } = useAnalytics()

// The offering with its own landing page leads as a full-width card; the rest
// follow as equal half-width cards. Ranking is column span and content depth,
// not extra decoration — same two-tier idea as the home page's tools grid.
const featured = OFFERINGS.filter(o => o.cta.kind === 'page')
const rest = OFFERINGS.filter(o => o.cta.kind !== 'page')

const cardClasses = 'group relative flex flex-col rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400 dark:hover:border-accent-500/60 hover:shadow-lg hover:shadow-accent-500/10'
</script>

<template>
  <div class="text-slate-600 dark:text-slate-300">
    <div class="container max-w-5xl mx-auto">
      <section class="py-14 px-6">
        <p class="eyebrow mb-2">
          {{ servicesPage.content.eyebrow }}
        </p>
        <h1 class="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {{ servicesPage.content.title }}
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
          {{ servicesPage.content.lede }}
        </p>
        <p class="mt-4 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <template v-for="(fact, i) in servicesPage.content.facts" :key="fact">
            <span v-if="i > 0" class="text-accent-500" aria-hidden="true"> · </span>{{ fact }}
          </template>
        </p>

        <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NuxtLink
            v-for="offering in featured"
            :key="offering.id"
            v-spotlight
            v-reveal
            :to="offering.cta.kind === 'page' ? offering.cta.path : '/services'"
            :class="cardClasses"
            class="lg:col-span-2"
            @click="trackCta(offering.id, 'services_index')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-950/50 dark:text-accent-400 dark:ring-accent-900/60 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
                <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span class="rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {{ offering.tag }}
                </span>
                <span class="rounded-full bg-accent-50 dark:bg-accent-950/50 px-2.5 py-1 font-spacemono text-[10px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
                  Full page
                </span>
              </div>
            </div>

            <p class="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ offering.name }}
            </p>
            <p class="mt-2 grow max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ offering.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span class="font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
                {{ offering.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
                {{ offering.action }}
                <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </NuxtLink>

          <!-- Offerings without their own page target the form on this page with
               the service pre-tagged: deep-linkable, back-button-safe, and no
               thin 150-word route for search engines to dislike. -->
          <NuxtLink
            v-for="(offering, i) in rest"
            :key="offering.id"
            v-spotlight
            v-reveal="(i % 2) * 90"
            :to="{ path: '/services', query: { service: offering.id }, hash: '#inquiry' }"
            :class="cardClasses"
            @click="trackCta(offering.id, 'services_index')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 rounded-xl bg-accent-50 text-accent-600 ring-1 ring-accent-100 dark:bg-accent-950/50 dark:text-accent-400 dark:ring-accent-900/60 transition-transform duration-300 ease-expo motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3">
                <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <span class="mt-0.5 shrink-0 rounded-full border border-slate-200 dark:border-slate-700 px-2.5 py-1 font-spacemono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {{ offering.tag }}
              </span>
            </div>

            <p class="mt-4 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {{ offering.name }}
            </p>
            <p class="mt-2 grow text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {{ offering.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span class="font-spacemono text-[11px] text-slate-500 dark:text-slate-400">
                {{ offering.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-spacemono text-[11px] uppercase tracking-wider text-accent-600 dark:text-accent-400">
                {{ offering.action }}
                <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </NuxtLink>
        </div>

        <p class="mt-8 text-sm text-slate-500 dark:text-slate-400">
          {{ servicesPage.content.pickNote }}
        </p>
      </section>

      <section id="inquiry" class="pb-14 px-6 scroll-mt-28">
        <ServiceInquiryForm
          heading="Tell me what you need"
          lede="One message, and I'll reply within 24 hours with an honest read on whether I can help and what it would take. If it isn't something I can do well, I'll say so and point you elsewhere."
          :facts="['Reply within 24 h', 'no unsolicited calls']"
          location="services_index"
        />

        <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-spacemono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <NuxtLink to="/about" class="inline-flex items-center gap-1 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
            Who you'd be working with
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/contacts" class="inline-flex items-center gap-1 hover:text-accent-600 dark:hover:text-accent-400 transition-colors">
            Other ways to reach me
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
