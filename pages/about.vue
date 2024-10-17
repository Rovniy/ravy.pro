<script setup lang="ts">
import { aboutPage, socialNetworks } from '~/data'

useHead({
  title: aboutPage.meta.title,
  meta: [
    {
      name: 'description',
      content: aboutPage.meta.description,
    },
  ],
})

defineOgImageComponent('Blog', {
  headline: aboutPage.og.headline,
  title: aboutPage.og.title,
  description: aboutPage.og.description,
  link: aboutPage.og.link,
})
</script>

<template>
  <div class="py-5">
    <div class="sm:grid grid-cols-8 px-6 py-5 sm:py-9 gap-5 container max-w-5xl  mx-auto">
      <div class="col-span-5  max-w-md">
        <div class="flex justify-between">
          <div>
            <h1 class="text-xl sm:text-4xl  pb-2 font-bold" v-html="aboutPage.content.title" />

            <div class="my-3 pb-10 flex flex-wrap gap-2 md:gap-3">
              <NuxtLink
                v-for="item in socialNetworks"
                :key="item.name"
                :to="item.href"
                target="_blank"
                class="px-2 py-1 lg:px-3 lg:py-2 bg-gray-300 hover:bg-gray-200 text-gray-800 rounded-md dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-[#F1F2F4]"
                :aria-label="item.name"
              >
                <Icon :name="item.icon" size="1em" />
              </NuxtLink>
            </div>
          </div>

          <div class="sm:hidden block col-span-3 pb-5 dark:text-[#F1F2F4]">
            <NuxtImg
              format="webp"
              src="/andrei_rovnyi.png"
              width="125"
              height="115"
              quality="50"
              class="rounded-md"
            />
          </div>
        </div>

        <h3 class="text-base sm:text-3xl font-semibold pb-7 sm:pb-12" v-html="aboutPage.content.description" />

        <p v-html="aboutPage.content.aboutMe" />
      </div>

      <div class="hidden sm:block col-span-3">
        <NuxtImg
          format="webp"
          src="/andrei_rovnyi.png"
          width="450"
          height="500"
          quality="50"
          class="rounded-md"
        />
      </div>
    </div>
  </div>
</template>
