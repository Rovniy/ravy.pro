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

const cardClasses = 'group relative flex flex-col border border-line bg-panel p-6 transition-all duration-200  hover:border-accent'
</script>

<template>
  <div class="text-fg-muted">
    <div class="container max-w-5xl mx-auto">
      <section class="py-14 px-6">
        <p class="eyebrow mb-2">
          {{ servicesPage.content.eyebrow }}
        </p>
        <h1 class="text-5xl sm:text-6xl font-display font-extrabold uppercase text-fg leading-none">
          {{ servicesPage.content.title }}
        </h1>
        <p class="mt-4 max-w-2xl text-base leading-relaxed text-fg-muted">
          {{ servicesPage.content.lede }}
        </p>
        <p class="mt-4 font-spacemono text-micro uppercase tracking-wider text-fg-muted">
          <template v-for="(fact, i) in servicesPage.content.facts" :key="fact">
            <span v-if="i > 0" class="text-accent-500" aria-hidden="true"> · </span>{{ fact }}
          </template>
        </p>

        <div class="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NuxtLink
            v-for="offering in featured"
            :key="offering.id"
            v-reveal
            :to="offering.cta.kind === 'page' ? offering.cta.path : '/services'"
            :class="cardClasses"
            class="lg:col-span-2"
            @click="trackCta(offering.id, 'services_index')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 bg-panel-raised text-accent-ink border border-line transition-transform duration-300 ease-expo">
                <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <div class="flex flex-wrap items-center justify-end gap-2">
                <span class="border border-line px-2.5 py-1 font-spacemono text-micro uppercase tracking-wider text-fg-muted">
                  {{ offering.tag }}
                </span>
                <span class="bg-accent-50 dark:bg-accent-950/50 px-2.5 py-1 font-spacemono text-micro uppercase tracking-wider text-accent-ink">
                  Full page
                </span>
              </div>
            </div>

            <p class="mt-4 text-lg font-bold tracking-tight text-fg">
              {{ offering.name }}
            </p>
            <p class="mt-2 grow max-w-2xl text-sm leading-relaxed text-fg-muted">
              {{ offering.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span class="font-spacemono text-micro text-fg-muted">
                {{ offering.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-spacemono text-micro uppercase tracking-wider text-accent-ink">
                {{ offering.action }}
                <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </NuxtLink>

          <!-- Offerings without their own page target the form on this page with
               the service pre-tagged: deep-linkable, back-button-safe, and no
               thin 150-word route for search engines to dislike. -->
          <NuxtLink
            v-for="offering in rest"
            :key="offering.id"
            :to="{ path: '/services', query: { service: offering.id }, hash: '#inquiry' }"
            :class="cardClasses"
            @click="trackCta(offering.id, 'services_index')"
          >
            <div class="flex items-start justify-between gap-4">
              <span class="grid place-items-center w-12 h-12 bg-panel-raised text-accent-ink border border-line transition-transform duration-300 ease-expo">
                <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
              </span>
              <span class="mt-0.5 shrink-0 border border-line px-2.5 py-1 font-spacemono text-micro uppercase tracking-wider text-fg-muted">
                {{ offering.tag }}
              </span>
            </div>

            <p class="mt-4 text-lg font-bold tracking-tight text-fg">
              {{ offering.name }}
            </p>
            <p class="mt-2 grow text-sm leading-relaxed text-fg-muted">
              {{ offering.blurb }}
            </p>

            <div class="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <span class="font-spacemono text-micro text-fg-muted">
                {{ offering.meta }}
              </span>
              <span class="inline-flex items-center gap-1 font-spacemono text-micro uppercase tracking-wider text-accent-ink">
                {{ offering.action }}
                <Icon name="mdi:arrow-right" class="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </div>
          </NuxtLink>
        </div>

        <p class="mt-8 text-sm text-fg-muted">
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

        <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-spacemono text-micro uppercase tracking-wider text-fg-muted">
          <NuxtLink to="/about" class="inline-flex items-center gap-1 hover:text-accent-ink transition-colors">
            Who you'd be working with
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
          </NuxtLink>
          <NuxtLink to="/contacts" class="inline-flex items-center gap-1 hover:text-accent-ink transition-colors">
            Other ways to reach me
            <Icon name="mdi:arrow-right" class="w-3.5 h-3.5" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>
