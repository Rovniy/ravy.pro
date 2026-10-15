<script setup lang="ts">
import { aboutPage } from '~/data'

const { data } = await useAsyncData('about', () =>
  queryCollection('content').where('path', '=', '/pages/about').first())
if (!data?.value)
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useHead({
  title: aboutPage.meta.title,
  titleTemplate: '%s',
  meta: [
    {
      name: 'description',
      content: aboutPage.meta.description,
    },
  ],
})

useAboutSchema({
  description: aboutPage.meta.description,
})

defineOgImage('Blog', {
  headline: aboutPage.og.headline,
  title: aboutPage.og.title,
  description: aboutPage.og.description,
  link: aboutPage.og.link,
})

const roles = aboutPage.content.description.split(' · ')

// Figures already stated in the body (content/pages/about.md), pulled up as a
// stat strip. Change them there and here together.
const stats = [
  { value: '15', suffix: '+', label: 'Years shipping' },
  { value: '35', suffix: '+', label: 'Engineers managed' },
  { value: '10K', suffix: '+', label: 'RPS at peak' },
  { value: '$10M', label: 'Startup valuation' },
]

const CV_URL = 'https://ravy.pro/misc/andrei_rovnyi_cv.pdf'
const { trackCta } = useAnalytics()
</script>

<template>
  <div>
    <!-- The header is the same character-select language as the home hero:
         name in the display face, roles as tabs, portrait in a cut frame. The
         body below stays markdown (content/pages/about.md, Tina-editable). -->
    <section class="border-b border-line">
      <LayoutContainer class="py-12 md:py-16">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div class="md:col-span-7 min-w-0">
            <p class="eyebrow mb-4">
              About
            </p>
            <h1 class="mb-6 font-display italic font-extrabold uppercase text-6xl sm:text-7xl leading-none text-fg">
              {{ aboutPage.content.title }}
            </h1>
            <ul class="mb-7 flex flex-wrap gap-2" aria-label="Roles">
              <li
                v-for="(role, i) in roles"
                :key="role"
                class="skew-box px-3.5 py-1.5 font-display font-semibold text-base uppercase tracking-[0.06em] before:border"
                :class="i === 0 ? 'text-fg before:border-accent before:bg-accent/15' : 'text-fg-muted before:border-line-strong'"
              >
                {{ role }}
              </li>
            </ul>
            <div class="flex flex-wrap items-center gap-x-5 gap-y-4">
              <UiButton :to="CV_URL" target="_blank" @click="trackCta('about_cv', 'about_hero')">
                View my CV
                <Icon name="mdi:arrow-top-right" size="18" aria-hidden="true" />
              </UiButton>
              <UiButton variant="secondary" to="/contacts" @click="trackCta('about_contacts', 'about_hero')">
                Contact me
              </UiButton>
              <UiButton variant="link" to="/blogs">
                Read my blog
                <Icon name="mdi:arrow-right" size="18" aria-hidden="true" />
              </UiButton>
            </div>
          </div>

          <div class="md:col-span-5">
            <div class="relative max-w-sm mx-auto md:mr-0">
              <div class="absolute -inset-y-3 right-[14%] w-[36%] bg-accent -skew-x-10" aria-hidden="true" />
              <div class="frame cut relative">
                <div class="frame-inner cut relative overflow-hidden">
                  <div class="hazard absolute inset-x-0 top-0 h-2.5 z-10" aria-hidden="true" />
                  <NuxtImg
                    src="/photos/a_rovnyi_deep.webp"
                    alt="Andrei Rovnyi"
                    width="384"
                    height="512"
                    class="w-full aspect-[3/4] object-cover"
                    sizes="sm:100vw md:384px"
                    densities="x1 x2"
                    loading="eager"
                    fetchpriority="high"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-12 grid grid-cols-2 md:grid-cols-4 gap-y-8 border-t border-line pt-6">
          <UiStat
            v-for="stat in stats"
            :key="stat.label"
            :value="stat.value"
            :suffix="stat.suffix"
            :label="stat.label"
          />
        </div>
      </LayoutContainer>
    </section>

    <LayoutContainer class="py-12">
      <div class="prose prose-sm sm:prose-base md:prose-lg prose-slate dark:prose-invert max-w-none prose-img:mx-auto prose-img:block">
        <ContentRenderer v-if="data" :value="data" />
      </div>
    </LayoutContainer>
  </div>
</template>
