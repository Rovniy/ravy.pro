<script setup lang="ts">
import { OFFERINGS } from '~/data/offerings'

// The primary commercial block of the home page, directly under the hero. It
// is the only section that opens with the hazard strip, which is what marks it
// as top-level content rather than one more list.
const { trackCta } = useAnalytics()

function linkFor(offering: typeof OFFERINGS[number]) {
  return offering.cta.kind === 'page'
    ? offering.cta.path
    : { path: '/services', query: { service: offering.id }, hash: '#inquiry' }
}
</script>

<template>
  <section class="relative border-b border-line">
    <div class="hazard h-2" aria-hidden="true" />

    <LayoutContainer class="py-14 sm:py-20">
      <UiSectionHeader eyebrow="Working together" title="Services">
        <template #action>
          <UiButton size="sm" to="/services" @click="trackCta('services-index', 'home_services')">
            All services
            <Icon name="mdi:arrow-right" size="16" aria-hidden="true" />
          </UiButton>
        </template>
      </UiSectionHeader>

      <p class="-mt-2 mb-8 max-w-2xl text-base leading-relaxed text-fg-muted">
        Work with me directly: mentorship, consulting, or part-time engineering help for your team. Each one starts with a conversation rather than a checkout.
      </p>

      <!-- 2×2, not 3-across: with four offerings a three-column grid leaves a
           lone card on the second row. -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        <UiCard
          v-for="offering in OFFERINGS"
          :key="offering.id"
          :to="linkFor(offering)"
          @click="trackCta(offering.id, 'home_services')"
        >
          <div class="flex items-start justify-between gap-3">
            <span class="grid place-items-center w-12 h-12 bg-accent text-accent-fg">
              <Icon :name="offering.icon" class="w-6 h-6" aria-hidden="true" />
            </span>
            <span class="mt-1 text-right font-spacemono text-micro uppercase tracking-[0.1em] text-fg-subtle">
              {{ offering.tag }}
            </span>
          </div>

          <p class="mt-5 font-display font-extrabold uppercase text-3xl leading-none text-fg">
            {{ offering.name }}
          </p>
          <p class="mt-3 grow text-sm leading-relaxed text-fg-muted">
            {{ offering.tagline }}
          </p>

          <div class="mt-5 pt-4 border-t border-line flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <p class="font-spacemono text-micro leading-relaxed text-fg-subtle">
              {{ offering.meta }}
            </p>
            <span class="inline-flex items-center gap-1.5 font-display font-bold text-base uppercase tracking-[0.06em] text-accent-ink">
              {{ offering.action }}
              <Icon name="mdi:arrow-right" class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </div>
        </UiCard>
      </div>
    </LayoutContainer>
  </section>
</template>
